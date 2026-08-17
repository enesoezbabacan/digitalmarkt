import { describe, expect, it } from "vitest";

import {
  dsaAngabenVollstaendig,
  hatHausnummer,
  istPostfach,
  verkaeuferSchema,
} from "@/lib/validation/verkaeufer";

const GUELTIG = {
  name: "Testfirma Muster",
  email: "test@example.de",
  telefon: "+49 30 1234567",
  strasse: "Musterstraße 12a",
  plz: "12345",
  ort: "Berlin",
  land: "DE",
  steuernummer: "12/345/67890",
  ust_id: "",
  rechte_bestaetigt: true as const,
  bedingungen_akzeptiert: true as const,
};

describe("istPostfach", () => {
  it("erkennt Postfächer in verschiedenen Schreibweisen", () => {
    for (const eingabe of [
      "Postfach 12 34 56",
      "postfach 100",
      "POSTFACH 4711",
      "Post Fach 12",
      "P.O. Box 55",
      "PO Box 55",
      "Postbox 12",
      "Packstation 123",
      "postlagernd",
      "PF 1234",
    ]) {
      expect(istPostfach(eingabe), eingabe).toBe(true);
    }
  });

  it("hält echte Straßen für gültig", () => {
    for (const eingabe of [
      "Musterstraße 12a",
      "Am Hafen 3",
      "Postweg 7", // enthält "Post", ist aber eine echte Straße
      "Postplatz 1",
      "Hauptstr. 15",
    ]) {
      expect(istPostfach(eingabe), eingabe).toBe(false);
    }
  });
});

describe("hatHausnummer", () => {
  it("verlangt eine Ziffer in der Straßenangabe", () => {
    expect(hatHausnummer("Musterstraße 12a")).toBe(true);
    expect(hatHausnummer("Musterstraße")).toBe(false);
  });
});

describe("verkaeuferSchema", () => {
  it("nimmt vollständige Angaben an", () => {
    expect(verkaeuferSchema.safeParse(GUELTIG).success).toBe(true);
  });

  it("lehnt ein Postfach als Anschrift ab", () => {
    const ergebnis = verkaeuferSchema.safeParse({
      ...GUELTIG,
      strasse: "Postfach 12 34 56",
    });
    expect(ergebnis.success).toBe(false);
    expect(ergebnis.error?.issues[0].message).toContain("Postfach");
  });

  it("lehnt eine Straße ohne Hausnummer ab", () => {
    const ergebnis = verkaeuferSchema.safeParse({
      ...GUELTIG,
      strasse: "Musterstraße",
    });
    expect(ergebnis.success).toBe(false);
    expect(ergebnis.error?.issues[0].message).toContain("Hausnummer");
  });

  it("verlangt die Steuernummer (Art. 30 DSA)", () => {
    const ergebnis = verkaeuferSchema.safeParse({ ...GUELTIG, steuernummer: "" });
    expect(ergebnis.success).toBe(false);
    expect(
      ergebnis.error?.issues.some((i) => i.path[0] === "steuernummer"),
    ).toBe(true);
  });

  it("verlangt die Bestätigung der Rechteinhaberschaft", () => {
    const ergebnis = verkaeuferSchema.safeParse({
      ...GUELTIG,
      rechte_bestaetigt: false,
    });
    expect(ergebnis.success).toBe(false);
  });

  // Zwei getrennte Erklärungen: Die Rechtebestätigung darf die
  // Vertragsannahme nicht ersetzen und umgekehrt. Ohne diesen Test würde ein
  // späteres Zusammenlegen der beiden Häkchen niemandem auffallen.
  it("verlangt die Zustimmung zu AGB und Verkäufervertrag", () => {
    const ergebnis = verkaeuferSchema.safeParse({
      ...GUELTIG,
      bedingungen_akzeptiert: false,
    });
    expect(ergebnis.success).toBe(false);
    expect(
      ergebnis.error?.issues.some((i) => i.path[0] === "bedingungen_akzeptiert"),
    ).toBe(true);
  });

  it("lässt die eine Bestätigung nicht für die andere durchgehen", () => {
    for (const feld of ["rechte_bestaetigt", "bedingungen_akzeptiert"]) {
      const daten: Record<string, unknown> = { ...GUELTIG };
      delete daten[feld];
      expect(verkaeuferSchema.safeParse(daten).success).toBe(false);
    }
  });

  it("prüft die PLZ gegen das Länderformat", () => {
    expect(
      verkaeuferSchema.safeParse({ ...GUELTIG, land: "AT", plz: "12345" }).success,
    ).toBe(false);
    expect(
      verkaeuferSchema.safeParse({ ...GUELTIG, land: "AT", plz: "1010" }).success,
    ).toBe(true);
  });

  it("verlangt, dass die USt-IdNr. zum Sitzland passt", () => {
    expect(
      verkaeuferSchema.safeParse({ ...GUELTIG, ust_id: "ATU12345678" }).success,
    ).toBe(false);
    expect(
      verkaeuferSchema.safeParse({ ...GUELTIG, ust_id: "DE123456789" }).success,
    ).toBe(true);
  });
});

describe("dsaAngabenVollstaendig", () => {
  it("gibt grünes Licht bei vollständigen Angaben", () => {
    expect(dsaAngabenVollstaendig(GUELTIG).ok).toBe(true);
  });

  it("benennt fehlende Pflichtfelder", () => {
    const ergebnis = dsaAngabenVollstaendig({ ...GUELTIG, steuernummer: "" });
    expect(ergebnis.ok).toBe(false);
    expect(ergebnis.fehlend).toContain("Steuernummer");
  });

  it("greift auch bei nachträglich auf ein Postfach geänderter Adresse", () => {
    const ergebnis = dsaAngabenVollstaendig({
      ...GUELTIG,
      strasse: "Postfach 999",
    });
    expect(ergebnis.ok).toBe(false);
  });
});
