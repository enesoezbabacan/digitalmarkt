import { randomUUID, scryptSync, randomBytes, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { BEDINGUNGEN_FASSUNG } from "@/lib/bedingungen";

import type {
  Bestellung,
  Datenschicht,
  Meldung,
  NeuerVerkaeufer,
  NeuesProdukt,
  Produkt,
  ProduktMitVerkaeufer,
  ProduktStatus,
  Verkaeufer,
} from "./typen";

/**
 * Lokale Datenschicht — speichert alles in JSON-Dateien unter .lokale-daten/.
 *
 * Zweck: Phase 1 lässt sich damit komplett bauen und im Browser vorführen,
 * OHNE dass irgendein Konto angelegt werden muss. Sobald das Supabase-Projekt
 * existiert, wird über DATENQUELLE=supabase umgeschaltet.
 *
 * Ausdrücklich NICHT für den Produktivbetrieb: keine Transaktionen, keine
 * gleichzeitigen Schreibzugriffe, keine echte Zugriffskontrolle in der
 * Datenbank. Die Mandantentrennung (Verkäufer A sieht B nicht) wird hier in
 * jeder Abfrage von Hand erzwungen — in Supabase übernimmt das RLS.
 */

/**
 * Ablageort der lokalen Daten.
 *
 * Über LOKALE_DATEN_ORDNER überschreibbar, damit Tests in einem Wegwerf-Ordner
 * arbeiten können. Sich dafür auf process.chdir() zu verlassen funktioniert
 * nicht — Testläufer führen Dateien in eigenen Umgebungen aus, in denen ein
 * Verzeichniswechsel nicht greift, und der Test schreibt dann versehentlich in
 * die echten Entwicklungsdaten.
 */
function datenOrdner(): string {
  return (
    process.env.LOKALE_DATEN_ORDNER ?? path.join(process.cwd(), ".lokale-daten")
  );
}

function uploadOrdner(): string {
  return path.join(datenOrdner(), "produktdateien");
}

type Ablage = {
  verkaeufer: Array<Verkaeufer & { passwort_hash: string }>;
  produkte: Produkt[];
  bestellungen: Bestellung[];
  meldungen: Meldung[];
};

const LEER: Ablage = {
  verkaeufer: [],
  produkte: [],
  bestellungen: [],
  meldungen: [],
};

async function lesen(): Promise<Ablage> {
  try {
    const roh = await readFile(path.join(datenOrdner(), "daten.json"), "utf8");
    return { ...LEER, ...(JSON.parse(roh) as Partial<Ablage>) };
  } catch {
    return structuredClone(LEER);
  }
}

async function schreiben(ablage: Ablage): Promise<void> {
  await mkdir(datenOrdner(), { recursive: true });
  await writeFile(
    path.join(datenOrdner(), "daten.json"),
    JSON.stringify(ablage, null, 2),
    "utf8",
  );
}

function passwortHashen(passwort: string): string {
  const salz = randomBytes(16).toString("hex");
  const hash = scryptSync(passwort, salz, 64).toString("hex");
  return `${salz}:${hash}`;
}

function passwortPasst(passwort: string, gespeichert: string): boolean {
  const [salz, hash] = gespeichert.split(":");
  if (!salz || !hash) return false;
  const versuch = scryptSync(passwort, salz, 64);
  const original = Buffer.from(hash, "hex");
  if (versuch.length !== original.length) return false;
  return timingSafeEqual(versuch, original);
}

/** Entfernt den Passwort-Hash, bevor Verkäuferdaten die Datenschicht verlassen. */
function ohnePasswort(
  eintrag: Verkaeufer & { passwort_hash: string },
): Verkaeufer {
  const kopie: Partial<typeof eintrag> = { ...eintrag };
  delete kopie.passwort_hash;
  return kopie as Verkaeufer;
}

function oeffentlicheVerkaeuferdaten(v: Verkaeufer) {
  return {
    id: v.id,
    name: v.name,
    ort: v.ort,
    land: v.land,
    kleinunternehmer: v.kleinunternehmer ?? true,
  };
}

export class LokaleDatenschicht implements Datenschicht {
  async katalog(filter?: { suche?: string; kategorie?: string }) {
    const { produkte, verkaeufer } = await lesen();
    const suche = filter?.suche?.trim().toLowerCase();

    return produkte
      .filter((p) => p.status === "live")
      .filter((p) => !filter?.kategorie || p.kategorie === filter.kategorie)
      .filter(
        (p) =>
          !suche ||
          p.titel.toLowerCase().includes(suche) ||
          p.beschreibung.toLowerCase().includes(suche),
      )
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .flatMap<ProduktMitVerkaeufer>((p) => {
        const v = verkaeufer.find((k) => k.id === p.seller_id);
        return v ? [{ ...p, verkaeufer: oeffentlicheVerkaeuferdaten(v) }] : [];
      });
  }

  async produktOeffentlich(id: string) {
    const { produkte, verkaeufer } = await lesen();
    const p = produkte.find((x) => x.id === id && x.status === "live");
    if (!p) return null;
    const v = verkaeufer.find((k) => k.id === p.seller_id);
    if (!v) return null;
    return { ...p, verkaeufer: oeffentlicheVerkaeuferdaten(v) };
  }

  async kategorien() {
    const { produkte } = await lesen();
    return [
      ...new Set(produkte.filter((p) => p.status === "live").map((p) => p.kategorie)),
    ].sort();
  }

  async verkaeuferAnlegen(daten: NeuerVerkaeufer, passwort: string) {
    const ablage = await lesen();
    const email = daten.email.toLowerCase();

    if (ablage.verkaeufer.some((v) => v.email === email)) {
      return { fehler: "Für diese E-Mail-Adresse gibt es bereits ein Konto." };
    }

    const jetzt = new Date().toISOString();
    ablage.verkaeufer.push({
      ...daten,
      email,
      id: randomUUID(),
      status: "pending",
      stripe_account_id: null,
      kleinunternehmer: true,
      ust_id_pruefergebnis: null,
      ust_id_geprueft_at: null,
      rechte_bestaetigt_at: jetzt,
      bedingungen_akzeptiert_at: jetzt,
      bedingungen_fassung: BEDINGUNGEN_FASSUNG,
      created_at: jetzt,
      passwort_hash: passwortHashen(passwort),
    });

    await schreiben(ablage);
    return { id: ablage.verkaeufer.at(-1)!.id };
  }

  async verkaeuferPerLogin(email: string, passwort: string) {
    const { verkaeufer } = await lesen();
    const treffer = verkaeufer.find((v) => v.email === email.toLowerCase());
    if (!treffer || !passwortPasst(passwort, treffer.passwort_hash)) return null;
    return ohnePasswort(treffer);
  }

  async verkaeufer(id: string) {
    const { verkaeufer } = await lesen();
    const treffer = verkaeufer.find((v) => v.id === id);
    if (!treffer) return null;
    return ohnePasswort(treffer);
  }

  async ustPruefungSpeichern(id: string, ergebnis: string, geprueftAm: string) {
    const ablage = await lesen();
    const v = ablage.verkaeufer.find((x) => x.id === id);
    if (!v) return;
    v.ust_id_pruefergebnis = ergebnis;
    v.ust_id_geprueft_at = geprueftAm;
    await schreiben(ablage);
  }

  async eigeneProdukte(sellerId: string) {
    const { produkte } = await lesen();
    // Mandantentrennung: niemals ohne diesen Filter ausliefern.
    return produkte
      .filter((p) => p.seller_id === sellerId && p.status !== "removed")
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  async produktAnlegen(sellerId: string, daten: NeuesProdukt) {
    const ablage = await lesen();
    const produkt: Produkt = {
      ...daten,
      id: randomUUID(),
      seller_id: sellerId,
      waehrung: "EUR",
      datei_pfad: null,
      datei_name: null,
      datei_groesse: null,
      vorschau_bild: null,
      status: "draft",
      created_at: new Date().toISOString(),
    };
    ablage.produkte.push(produkt);
    await schreiben(ablage);
    return produkt;
  }

  async produktAktualisieren(
    sellerId: string,
    produktId: string,
    daten: Partial<NeuesProdukt> & { status?: ProduktStatus },
  ) {
    const ablage = await lesen();
    const produkt = ablage.produkte.find(
      (p) => p.id === produktId && p.seller_id === sellerId,
    );
    if (!produkt) return null;

    Object.assign(produkt, daten);
    await schreiben(ablage);
    return produkt;
  }

  async produktDateiSpeichern(
    sellerId: string,
    produktId: string,
    datei: { name: string; groesse: number; inhalt: Uint8Array },
  ) {
    const ablage = await lesen();
    const produkt = ablage.produkte.find(
      (p) => p.id === produktId && p.seller_id === sellerId,
    );
    if (!produkt) return { fehler: "Produkt nicht gefunden." };

    // Dateiname niemals vom Nutzer übernehmen — sonst sind Pfade wie
    // "../../etc/passwd" möglich. Wir vergeben den Namen selbst.
    const endung = path.extname(datei.name).slice(0, 10).replace(/[^.\w]/g, "");
    const pfad = path.join(sellerId, `${produktId}${endung}`);

    await mkdir(path.join(uploadOrdner(), sellerId), { recursive: true });
    await writeFile(path.join(uploadOrdner(), pfad), datei.inhalt);

    produkt.datei_pfad = pfad;
    produkt.datei_name = datei.name;
    produkt.datei_groesse = datei.groesse;
    await schreiben(ablage);

    return { pfad };
  }

  async eigeneBestellungen(sellerId: string) {
    const { bestellungen } = await lesen();
    return bestellungen
      .filter((b) => b.seller_id === sellerId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
}
