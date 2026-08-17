import { describe, expect, it } from "vitest";

import {
  PROVISION_PROZENT,
  euroStringZuCent,
  formatEuro,
  provisionCent,
  verkaeuferAnteilCent,
} from "@/lib/geld";

describe("euroStringZuCent", () => {
  it("akzeptiert Komma und Punkt als Trennzeichen", () => {
    expect(euroStringZuCent("19,90")).toBe(1990);
    expect(euroStringZuCent("19.90")).toBe(1990);
  });

  it("rechnet ohne Fließkomma-Fehler", () => {
    // 19.99 * 100 ergibt in JavaScript 1998.9999999999998 — genau das darf
    // hier nicht passieren.
    expect(euroStringZuCent("19,99")).toBe(1999);
    expect(euroStringZuCent("0,29")).toBe(29);
    expect(euroStringZuCent("1234,56")).toBe(123456);
  });

  it("ergänzt fehlende Nachkommastellen", () => {
    expect(euroStringZuCent("5")).toBe(500);
    expect(euroStringZuCent("5,5")).toBe(550);
  });

  it("weist ungültige Eingaben ab", () => {
    for (const eingabe of ["", "abc", "-5", "19,999", "1e3", "19,9,9", "€19"]) {
      expect(euroStringZuCent(eingabe), eingabe).toBeNull();
    }
  });
});

describe("formatEuro", () => {
  it("formatiert deutsch mit Komma und Eurozeichen", () => {
    // Intl setzt ein schmales geschütztes Leerzeichen vor das €-Zeichen.
    expect(formatEuro(1990).replace(/ | /g, " ")).toBe("19,90 €");
    expect(formatEuro(0).replace(/ | /g, " ")).toBe("0,00 €");
  });
});

describe("Provision", () => {
  it("behält den vereinbarten Prozentsatz ein", () => {
    expect(provisionCent(2000)).toBe(2000 * (PROVISION_PROZENT / 100));
    expect(provisionCent(2000)).toBe(400);
    expect(verkaeuferAnteilCent(2000)).toBe(1600);
  });

  it("rundet zugunsten des Verkäufers ab", () => {
    // 20 % von 999 = 199,8 -> abgerundet 199, der Verkäufer bekommt 800.
    expect(provisionCent(999)).toBe(199);
    expect(verkaeuferAnteilCent(999)).toBe(800);
  });

  it("verliert nie einen Cent", () => {
    for (let betrag = 100; betrag <= 5000; betrag += 7) {
      expect(provisionCent(betrag) + verkaeuferAnteilCent(betrag)).toBe(betrag);
    }
  });
});
