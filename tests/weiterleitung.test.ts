import { describe, expect, it } from "vitest";

import { sicheresZiel } from "@/lib/weiterleitung";

/**
 * Der Anmelde-Link kommt per E-Mail. Ohne diese Prüfung könnte jemand ein
 * `next` anhängen, das auf eine fremde Seite zeigt — der Nutzer meldet sich
 * echt bei uns an und landet dann auf einer Betrugsseite, die er für unsere
 * hält.
 */
describe("Weiterleitungsziel aus der URL", () => {
  it("nimmt eigene Pfade an", () => {
    expect(sicheresZiel("/passwort-neu")).toBe("/passwort-neu");
    expect(sicheresZiel("/admin")).toBe("/admin");
  });

  it("fällt ohne Angabe auf das Dashboard zurück", () => {
    expect(sicheresZiel(null)).toBe("/dashboard");
    expect(sicheresZiel("")).toBe("/dashboard");
  });

  it("lehnt fremde Adressen ab", () => {
    // Schema-relativ: der Browser ergänzt https: und landet bei example.com.
    expect(sicheresZiel("//example.com")).toBe("/dashboard");
    expect(sicheresZiel("https://example.com")).toBe("/dashboard");
    expect(sicheresZiel("http://example.com")).toBe("/dashboard");

    // Rückwärtsschrägstrich: manche Browser lesen ihn wie einen Schrägstrich.
    expect(sicheresZiel("/\\example.com")).toBe("/dashboard");
    expect(sicheresZiel("\\\\example.com")).toBe("/dashboard");
  });

  it("lehnt Ziele ohne führenden Schrägstrich ab", () => {
    expect(sicheresZiel("example.com")).toBe("/dashboard");
    expect(sicheresZiel("javascript:alert(1)")).toBe("/dashboard");
  });
});
