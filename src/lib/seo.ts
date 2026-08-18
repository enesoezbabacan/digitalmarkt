import { ANBIETER } from "./anbieter";

/**
 * Alles, was Suchmaschinen betrifft, an einer Stelle.
 *
 * Zwei Dinge werden hier entschieden:
 *
 * 1. **Unter welcher Adresse die Seite steht.** Suchmaschinen brauchen
 *    absolute Adressen — in der sitemap.xml und in den Produktdaten für
 *    Google. Relative Pfade sind dort wertlos.
 *
 * 2. **Ob die Seite überhaupt gefunden werden darf.** Solange der Marktplatz
 *    nicht freigegeben ist, sperrt robots.txt alle Suchmaschinen aus. Sonst
 *    landen Entwurfsstände im Google-Index und bleiben dort wochenlang, auch
 *    nachdem sie längst korrigiert wurden.
 */

/** Adresse der Seite ohne Schrägstrich am Ende. */
export function basisUrl(): string {
  const roh = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const url = roh && roh.length > 0 ? roh : `https://${ANBIETER.domain}`;
  return url.replace(/\/+$/, "");
}

/** Macht aus "/produkt/123" die vollständige Adresse. */
export function absolut(pfad: string): string {
  return `${basisUrl()}${pfad.startsWith("/") ? pfad : `/${pfad}`}`;
}

/**
 * Darf die Seite in Suchmaschinen erscheinen?
 *
 * Bewusst ein ausdrückliches Ja: Es muss jemand SUCHMASCHINEN=erlaubt
 * eintragen. Ein vergessener Schalter führt so dazu, dass die Seite *nicht*
 * gefunden wird — der harmlose Fehler. Umgekehrt wäre es der teure.
 *
 * Zusätzlich bleibt eine Testadresse immer gesperrt, egal was eingetragen ist.
 */
export function suchmaschinenErlaubt(): boolean {
  const url = basisUrl();
  if (/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(url)) {
    return false;
  }
  return process.env.SUCHMASCHINEN?.trim().toLowerCase() === "erlaubt";
}

/**
 * Bereiche, die nie in den Index gehören.
 *
 * /download und /kauf enthalten Einmal-Token, /dashboard und /admin sind
 * persönliche Bereiche. Der Schutz dieser Seiten liegt nicht hier — er liegt
 * in der Anmeldung. Das hier verhindert nur, dass sie in Suchergebnissen
 * auftauchen.
 */
export const GESPERRTE_PFADE = [
  "/admin",
  "/api",
  "/auth",
  "/dashboard",
  "/download",
  "/kauf",
  "/passwort-neu",
  "/passwort-vergessen",
  "/anmelden",
  "/abmelden",
];
