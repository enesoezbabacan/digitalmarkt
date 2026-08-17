import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { LokaleDatenschicht } from "@/lib/db/lokal";

/**
 * Der wichtigste Test der Phase 1: Verkäufer dürfen ausschließlich ihre
 * eigenen Daten sehen. Ein Fehler hier legt Umsätze und Anschriften fremder
 * Verkäufer offen.
 *
 * In der lokalen Datenschicht wird die Trennung in jeder Abfrage von Hand
 * erzwungen. In Supabase übernimmt das später Row Level Security — dieser Test
 * wird dann gegen die echte Datenbank gefahren und muss unverändert bestehen.
 */

const db = new LokaleDatenschicht();
let arbeitsordner: string;

const basisdaten = {
  telefon: "+49 30 1234567",
  strasse: "Musterstraße 12a",
  plz: "12345",
  ort: "Berlin",
  land: "DE",
  steuernummer: "12/345/67890",
  ust_id: null,
  kleinunternehmer: true,
};

let aId: string;
let bId: string;

beforeAll(async () => {
  // Wegwerf-Ordner, damit die Entwicklungsdaten unberührt bleiben.
  // Der Ordner wird über die Umgebungsvariable gesetzt, NICHT über
  // process.chdir() — ein Verzeichniswechsel greift im Testläufer nicht und
  // der Test schreibt dann unbemerkt in die echten Daten.
  arbeitsordner = await mkdtemp(path.join(tmpdir(), "digitalmarkt-test-"));
  process.env.LOKALE_DATEN_ORDNER = arbeitsordner;

  const a = await db.verkaeuferAnlegen(
    { ...basisdaten, name: "Verkäufer A", email: "a@example.de" },
    "PasswortAAAA1",
  );
  const b = await db.verkaeuferAnlegen(
    { ...basisdaten, name: "Verkäufer B", email: "b@example.de" },
    "PasswortBBBB1",
  );

  if ("fehler" in a || "fehler" in b) throw new Error("Anlegen fehlgeschlagen");
  aId = a.id;
  bId = b.id;
});

afterAll(async () => {
  delete process.env.LOKALE_DATEN_ORDNER;
  await rm(arbeitsordner, { recursive: true, force: true });
});

describe("Trennung zwischen Verkäufern", () => {
  it("zeigt jedem Verkäufer nur die eigenen Produkte", async () => {
    await db.produktAnlegen(aId, {
      titel: "Produkt von A",
      beschreibung: "Eine ausreichend lange Beschreibung von A.",
      kategorie: "E-Book",
      preis_cent: 1990,
    });
    await db.produktAnlegen(bId, {
      titel: "Produkt von B",
      beschreibung: "Eine ausreichend lange Beschreibung von B.",
      kategorie: "Vorlage",
      preis_cent: 2990,
    });

    const produkteA = await db.eigeneProdukte(aId);
    const produkteB = await db.eigeneProdukte(bId);

    expect(produkteA.map((p) => p.titel)).toEqual(["Produkt von A"]);
    expect(produkteB.map((p) => p.titel)).toEqual(["Produkt von B"]);
  });

  it("lässt A das Produkt von B nicht verändern", async () => {
    const [produktB] = await db.eigeneProdukte(bId);

    // A kennt die ID von B und versucht, das Produkt freizuschalten.
    const versuch = await db.produktAktualisieren(aId, produktB.id, {
      status: "live",
      titel: "Übernommen von A",
    });

    expect(versuch).toBeNull();

    const [unveraendert] = await db.eigeneProdukte(bId);
    expect(unveraendert.titel).toBe("Produkt von B");
    expect(unveraendert.status).toBe("draft");
  });

  it("lässt A keine Datei in das Produkt von B legen", async () => {
    const [produktB] = await db.eigeneProdukte(bId);

    const versuch = await db.produktDateiSpeichern(aId, produktB.id, {
      name: "fremd.pdf",
      groesse: 3,
      inhalt: new Uint8Array([1, 2, 3]),
    });

    expect(versuch).toEqual({ fehler: "Produkt nicht gefunden." });
  });

  it("gibt das Passwort nicht mit den Verkäuferdaten heraus", async () => {
    const verkaeufer = await db.verkaeufer(aId);
    expect(verkaeufer).not.toBeNull();
    expect(verkaeufer).not.toHaveProperty("passwort_hash");
  });

  it("meldet nur bei korrektem Passwort an", async () => {
    expect(await db.verkaeuferPerLogin("a@example.de", "falsch")).toBeNull();
    expect(await db.verkaeuferPerLogin("a@example.de", "PasswortAAAA1")).not.toBeNull();
  });
});

describe("Katalog", () => {
  it("zeigt Entwürfe nicht öffentlich an", async () => {
    // Beide Produkte stehen auf 'draft'.
    expect(await db.katalog()).toEqual([]);

    const [produktA] = await db.eigeneProdukte(aId);
    expect(await db.produktOeffentlich(produktA.id)).toBeNull();
  });

  it("zeigt freigeschaltete Produkte mit Verkäuferangaben", async () => {
    const [produktA] = await db.eigeneProdukte(aId);
    await db.produktAktualisieren(aId, produktA.id, { status: "live" });

    const katalog = await db.katalog();
    expect(katalog).toHaveLength(1);
    expect(katalog[0].titel).toBe("Produkt von A");
    expect(katalog[0].verkaeufer.name).toBe("Verkäufer A");

    // Die öffentliche Ansicht darf keine Kontaktdaten preisgeben.
    expect(katalog[0].verkaeufer).not.toHaveProperty("steuernummer");
    expect(katalog[0].verkaeufer).not.toHaveProperty("email");
    expect(katalog[0].verkaeufer).not.toHaveProperty("telefon");
  });

  it("filtert nach Suchbegriff", async () => {
    expect(await db.katalog({ suche: "von A" })).toHaveLength(1);
    expect(await db.katalog({ suche: "gibtesnicht" })).toHaveLength(0);
  });
});

describe("Dateiablage", () => {
  it("übernimmt den Dateinamen des Nutzers nicht als Pfad", async () => {
    const [produktA] = await db.eigeneProdukte(aId);

    const ergebnis = await db.produktDateiSpeichern(aId, produktA.id, {
      name: "../../../etc/passwd",
      groesse: 3,
      inhalt: new Uint8Array([1, 2, 3]),
    });

    expect(ergebnis).not.toHaveProperty("fehler");

    const pfad = (ergebnis as { pfad?: string }).pfad;
    expect(pfad).toBeDefined();
    expect(pfad).not.toContain("..");
    expect(pfad!.startsWith(aId)).toBe(true);
  });
});
