import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests für die Zugangssperre des Admin-Bereichs.
 *
 * Der Admin-Bereich arbeitet mit dem service_role-Schlüssel und umgeht damit
 * Row Level Security vollständig — er sieht Anschriften, Steuernummern und
 * Umsätze ALLER Verkäufer. Diese Prüfung ist das Einzige, was dazwischen
 * steht. Ein Fehler hier ist ein Datenleck, kein Schönheitsfehler.
 */

/** Was auth.getUser() zurückgeben soll. */
let angemeldeteEmail: string | null = null;

vi.mock("@/lib/supabase/server", () => ({
  supabaseServer: () =>
    Promise.resolve({
      auth: {
        getUser: () =>
          Promise.resolve({
            data: { user: angemeldeteEmail ? { email: angemeldeteEmail } : null },
          }),
      },
    }),
}));

const { istAdmin, adminPflicht } = await import("@/lib/admin");
const { adminZahlen } = await import("@/lib/db/admin");

const urspruenglich = { ...process.env };

beforeEach(() => {
  process.env.DATENQUELLE = "supabase";
  angemeldeteEmail = null;
});

afterEach(() => {
  process.env = { ...urspruenglich };
});

describe("Zugang zum Admin-Bereich", () => {
  it("lässt niemanden herein, wenn ADMIN_EMAILS leer ist", async () => {
    delete process.env.ADMIN_EMAILS;
    angemeldeteEmail = "enes@select-prime.de";
    expect(await istAdmin()).toBe(false);

    // Auch nicht als leerer String oder als reine Kommas.
    process.env.ADMIN_EMAILS = "";
    expect(await istAdmin()).toBe(false);
    process.env.ADMIN_EMAILS = " , , ";
    expect(await istAdmin()).toBe(false);
  });

  it("lässt nicht angemeldete Besucher nicht herein", async () => {
    process.env.ADMIN_EMAILS = "enes@select-prime.de";
    angemeldeteEmail = null;
    expect(await istAdmin()).toBe(false);
  });

  it("lässt angemeldete Verkäufer nicht herein, die nicht auf der Liste stehen", async () => {
    process.env.ADMIN_EMAILS = "enes@select-prime.de";
    angemeldeteEmail = "fremder@example.de";
    expect(await istAdmin()).toBe(false);
  });

  it("lässt die hinterlegte Adresse herein", async () => {
    process.env.ADMIN_EMAILS = "enes@select-prime.de";
    angemeldeteEmail = "enes@select-prime.de";
    expect(await istAdmin()).toBe(true);
  });

  it("ignoriert Groß- und Kleinschreibung und Leerzeichen", async () => {
    process.env.ADMIN_EMAILS = " Enes@Select-Prime.DE , zweiter@example.de ";
    angemeldeteEmail = "enes@select-prime.de";
    expect(await istAdmin()).toBe(true);

    angemeldeteEmail = "zweiter@example.de";
    expect(await istAdmin()).toBe(true);
  });

  it("lässt sich nicht durch eine Teilübereinstimmung austricksen", async () => {
    process.env.ADMIN_EMAILS = "enes@select-prime.de";

    // Fremde Domain, die die erlaubte Adresse enthält.
    angemeldeteEmail = "enes@select-prime.de.angreifer.example";
    expect(await istAdmin()).toBe(false);

    angemeldeteEmail = "nicht-enes@select-prime.de";
    expect(await istAdmin()).toBe(false);
  });

  it("wirft in adminPflicht, statt still weiterzulaufen", async () => {
    process.env.ADMIN_EMAILS = "enes@select-prime.de";
    angemeldeteEmail = "fremder@example.de";

    await expect(adminPflicht()).rejects.toThrow(/Kein Zugriff/);
  });

  it("verweigert Admin-Datenabfragen ohne Berechtigung", async () => {
    process.env.ADMIN_EMAILS = "enes@select-prime.de";
    angemeldeteEmail = "fremder@example.de";

    // Der Import erfolgt hier, damit die Attrappe oben bereits greift.
    const { adminProdukte, adminVerkaeufer, adminBestellungen, adminMeldungen } =
      await import("@/lib/db/admin");

    // Keine dieser Funktionen darf ohne Prüfung an die Datenbank gehen.
    await expect(adminProdukte()).rejects.toThrow(/Kein Zugriff/);
    await expect(adminVerkaeufer()).rejects.toThrow(/Kein Zugriff/);
    await expect(adminBestellungen()).rejects.toThrow(/Kein Zugriff/);
    await expect(adminMeldungen()).rejects.toThrow(/Kein Zugriff/);
  });
});

describe("Kennzahlen der Übersicht", () => {
  const bestellung = (
    betrag: number,
    provision: number,
    status: "bezahlt" | "erstattet" | "storniert",
  ) =>
    ({
      betrag_cent: betrag,
      provision_cent: provision,
      status,
    }) as never;

  it("zählt erstattete und stornierte Käufe nicht zum Umsatz", () => {
    const zahlen = adminZahlen(
      [],
      [],
      [
        bestellung(1990, 398, "bezahlt"),
        bestellung(2990, 598, "bezahlt"),
        bestellung(9990, 1998, "erstattet"),
        bestellung(4990, 998, "storniert"),
      ],
      [],
    );

    expect(zahlen.umsatzCent).toBe(1990 + 2990);
    expect(zahlen.provisionCent).toBe(398 + 598);
    expect(zahlen.verkaeufe).toBe(2);
    expect(zahlen.erstattungen).toBe(1);
  });

  it("zählt gesperrte Verkäufer nicht als aktiv", () => {
    const zahlen = adminZahlen(
      [
        { status: "live" } as never,
        { status: "review" } as never,
        { status: "draft" } as never,
      ],
      [
        { status: "active" } as never,
        { status: "pending" } as never,
        { status: "suspended" } as never,
      ],
      [],
      [{ status: "offen" } as never, { status: "erledigt" } as never],
    );

    expect(zahlen.produkteLive).toBe(1);
    expect(zahlen.produkteWartend).toBe(1);
    expect(zahlen.verkaeuferAktiv).toBe(2);
    expect(zahlen.meldungenOffen).toBe(1);
  });
});
