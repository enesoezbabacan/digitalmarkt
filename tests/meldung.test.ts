import { describe, expect, it } from "vitest";

import { grundText, meldungSchema } from "@/lib/validation/meldung";

/**
 * Tests für die Prüfung einer Meldung nach Art. 16 DSA.
 *
 * Zwei Anforderungen stehen sich hier gegenüber: Die Meldung muss JEDEM
 * offenstehen — ohne Konto, ohne Anmeldung —, sie muss aber auch "hinreichend
 * präzise und begründet" sein. Wird die Prüfung zu streng, verhindert sie
 * Meldungen, die kommen müssten. Wird sie zu lasch, ist die Meldung für den
 * Betreiber nicht bearbeitbar.
 */

const GUELTIG = {
  produkt_id: "3f6a1e42-9c1d-4f2b-8a7e-1b2c3d4e5f60",
  melder_email: "melder@example.de",
  melder_name: "Max Mustermann",
  kategorie: "Urheberrechtsverletzung" as const,
  begruendung:
    "Der Inhalt dieses E-Books stammt wörtlich aus meinem 2024 erschienenen Buch.",
  richtigkeit_bestaetigt: true as const,
};

describe("Prüfung einer Meldung", () => {
  it("nimmt eine vollständige Meldung an", () => {
    expect(meldungSchema.safeParse(GUELTIG).success).toBe(true);
  });

  it("lässt den Namen weg — Meldungen dürfen anonym sein", () => {
    const { melder_name, ...ohneNamen } = GUELTIG;
    expect(meldungSchema.safeParse(ohneNamen).success).toBe(true);
    expect(
      meldungSchema.safeParse({ ...ohneNamen, melder_name: undefined }).success,
    ).toBe(true);
  });

  it("verlangt die Bestätigung nach bestem Wissen (Art. 16 Abs. 2 lit. d)", () => {
    const ergebnis = meldungSchema.safeParse({
      ...GUELTIG,
      richtigkeit_bestaetigt: false,
    });
    expect(ergebnis.success).toBe(false);
    expect(
      ergebnis.error?.issues.some((i) => i.path[0] === "richtigkeit_bestaetigt"),
    ).toBe(true);
  });

  it("verlangt eine E-Mail-Adresse für die Eingangsbestätigung", () => {
    for (const email of ["", "keine-mail", "@example.de", "a@"]) {
      expect(
        meldungSchema.safeParse({ ...GUELTIG, melder_email: email }).success,
      ).toBe(false);
    }
  });

  it("weist zu knappe Begründungen ab", () => {
    const ergebnis = meldungSchema.safeParse({
      ...GUELTIG,
      begruendung: "ist verboten",
    });
    expect(ergebnis.success).toBe(false);
    expect(ergebnis.error?.issues[0].message).toMatch(/20 Zeichen/);
  });

  it("weist eine erfundene Produktkennung ab", () => {
    expect(
      meldungSchema.safeParse({ ...GUELTIG, produkt_id: "irgendwas" }).success,
    ).toBe(false);
  });

  it("lässt nur die vorgesehenen Kategorien zu", () => {
    expect(
      meldungSchema.safeParse({ ...GUELTIG, kategorie: "Ausgedacht" }).success,
    ).toBe(false);
  });

  it("schneidet überlange Begründungen nicht ab, sondern lehnt sie ab", () => {
    expect(
      meldungSchema.safeParse({ ...GUELTIG, begruendung: "a".repeat(5001) })
        .success,
    ).toBe(false);
  });
});

describe("Gespeicherter Grundtext", () => {
  it("stellt die Kategorie voran, damit die Liste lesbar bleibt", () => {
    expect(grundText("Urheberrechtsverletzung", "Text daraus kopiert.")).toBe(
      "[Urheberrechtsverletzung] Text daraus kopiert.",
    );
  });
});
