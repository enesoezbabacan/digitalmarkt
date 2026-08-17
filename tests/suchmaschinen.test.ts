import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Die Sperre gegen Suchmaschinen ist der Teil mit echtem Schadenspotenzial:
 * Ein Entwurfsstand, der einmal im Google-Index steht, bleibt dort wochenlang.
 * Deshalb wird hier jeder Weg geprüft, auf dem die Sperre aufgehen könnte.
 *
 * Die Module lesen process.env beim Aufruf, nicht beim Laden — trotzdem wird
 * vor jedem Fall der Modulcache geleert, damit kein Zustand überdauert.
 */

const urspruenglich = { ...process.env };

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  process.env = { ...urspruenglich };
});

async function seo() {
  return import("../src/lib/seo");
}

describe("basisUrl", () => {
  it("entfernt den Schrägstrich am Ende", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://markt.select-prime.de/";
    expect((await seo()).basisUrl()).toBe("https://markt.select-prime.de");
  });

  it("fällt auf die Domain aus anbieter.ts zurück", async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect((await seo()).basisUrl()).toBe("https://markt.select-prime.de");
  });

  it("baut absolute Adressen auch ohne führenden Schrägstrich", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://beispiel.de";
    const { absolut } = await seo();
    expect(absolut("/produkt/1")).toBe("https://beispiel.de/produkt/1");
    expect(absolut("produkt/1")).toBe("https://beispiel.de/produkt/1");
  });
});

describe("suchmaschinenErlaubt", () => {
  it("ist ohne ausdrückliche Freigabe gesperrt", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://markt.select-prime.de";
    delete process.env.SUCHMASCHINEN;
    expect((await seo()).suchmaschinenErlaubt()).toBe(false);
  });

  it("öffnet nur beim Wert 'erlaubt'", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://markt.select-prime.de";
    for (const wert of ["ja", "true", "1", "gesperrt", ""]) {
      vi.resetModules();
      process.env.SUCHMASCHINEN = wert;
      expect((await seo()).suchmaschinenErlaubt()).toBe(false);
    }
    vi.resetModules();
    process.env.SUCHMASCHINEN = "  Erlaubt ";
    expect((await seo()).suchmaschinenErlaubt()).toBe(true);
  });

  it("bleibt auf localhost gesperrt, auch wenn freigegeben wurde", async () => {
    process.env.SUCHMASCHINEN = "erlaubt";
    for (const url of [
      "http://localhost:3000",
      "https://localhost",
      "http://127.0.0.1:3000",
    ]) {
      vi.resetModules();
      process.env.NEXT_PUBLIC_SITE_URL = url;
      expect((await seo()).suchmaschinenErlaubt()).toBe(false);
    }
  });

  it("verwechselt eine echte Domain nicht mit localhost", async () => {
    process.env.SUCHMASCHINEN = "erlaubt";
    process.env.NEXT_PUBLIC_SITE_URL = "https://localhost-shop.de";
    expect((await seo()).suchmaschinenErlaubt()).toBe(true);
  });
});

describe("robots.txt", () => {
  it("verbietet im gesperrten Zustand alles und nennt keine sitemap", async () => {
    process.env.SUCHMASCHINEN = "gesperrt";
    process.env.NEXT_PUBLIC_SITE_URL = "https://markt.select-prime.de";
    const robots = (await import("../src/app/robots")).default();
    expect(robots.rules).toEqual({ userAgent: "*", disallow: "/" });
    expect(robots.sitemap).toBeUndefined();
  });

  it("sperrt freigegeben weiterhin die persönlichen Bereiche", async () => {
    process.env.SUCHMASCHINEN = "erlaubt";
    process.env.NEXT_PUBLIC_SITE_URL = "https://markt.select-prime.de";
    const robots = (await import("../src/app/robots")).default();
    const regeln = Array.isArray(robots.rules) ? robots.rules[0] : robots.rules;
    const gesperrt = regeln.disallow as string[];

    // Token-behaftete und persönliche Bereiche dürfen nie in den Index.
    for (const pfad of ["/admin", "/download", "/kauf", "/dashboard", "/api"]) {
      expect(gesperrt).toContain(pfad);
    }
    // Kein Schrägstrich am Ende — sonst bliebe /admin selbst erreichbar.
    expect(gesperrt.some((p) => p.endsWith("/"))).toBe(false);
    // Was verkaufen soll, bleibt offen.
    expect(gesperrt).not.toContain("/produkt");
    expect(gesperrt).not.toContain("/automaten");
    expect(gesperrt).not.toContain("/registrieren");

    expect(robots.sitemap).toBe("https://markt.select-prime.de/sitemap.xml");
  });
});

describe("sitemap.xml", () => {
  it("ist im gesperrten Zustand leer", async () => {
    process.env.SUCHMASCHINEN = "gesperrt";
    process.env.NEXT_PUBLIC_SITE_URL = "https://markt.select-prime.de";
    expect(await (await import("../src/app/sitemap")).default()).toEqual([]);
  });

  it("führt freigegeben die festen Seiten und jedes Produkt auf", async () => {
    process.env.SUCHMASCHINEN = "erlaubt";
    process.env.NEXT_PUBLIC_SITE_URL = "https://markt.select-prime.de";

    vi.doMock("../src/lib/db", () => ({
      db: () => ({
        katalog: async () => [
          { id: "abc", created_at: "2026-08-01T10:00:00Z" },
          { id: "def", created_at: "2026-08-02T10:00:00Z" },
        ],
      }),
    }));

    const eintraege = await (await import("../src/app/sitemap")).default();
    const adressen = eintraege.map((e) => e.url);

    expect(adressen).toContain("https://markt.select-prime.de/");
    expect(adressen).toContain("https://markt.select-prime.de/automaten");
    expect(adressen).toContain("https://markt.select-prime.de/impressum");
    expect(adressen).toContain("https://markt.select-prime.de/produkt/abc");
    expect(adressen).toContain("https://markt.select-prime.de/produkt/def");

    // Nichts, was Anmeldung oder ein Token braucht.
    expect(adressen.some((a) => /\/(admin|dashboard|download|kauf)/.test(a))).toBe(
      false,
    );
    // Keine Adresse doppelt — doppelte Einträge wertet Google ab.
    expect(new Set(adressen).size).toBe(adressen.length);

    vi.doUnmock("../src/lib/db");
  });

  it("liefert bei Datenbankausfall die festen Seiten statt eines Fehlers", async () => {
    process.env.SUCHMASCHINEN = "erlaubt";
    process.env.NEXT_PUBLIC_SITE_URL = "https://markt.select-prime.de";

    vi.doMock("../src/lib/db", () => ({
      db: () => ({
        katalog: async () => {
          throw new Error("Datenbank nicht erreichbar");
        },
      }),
    }));

    const eintraege = await (await import("../src/app/sitemap")).default();
    expect(eintraege.length).toBeGreaterThan(0);
    expect(eintraege.every((e) => !e.url.includes("/produkt/"))).toBe(true);

    vi.doUnmock("../src/lib/db");
  });
});
