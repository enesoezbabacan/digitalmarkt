/**
 * Prüft ein Weiterleitungsziel, das aus einer URL stammt.
 *
 * Der Anmelde-Link kommt per E-Mail. Wer ihn abfängt oder nachbaut, könnte
 * sonst ein `next` anhängen, das auf eine fremde Seite zeigt — der Nutzer
 * landet nach einer echten Anmeldung auf unserer Domain plötzlich auf einer
 * Betrugsseite und hält sie für unsere ("offene Weiterleitung").
 *
 * Zugelassen ist deshalb nur ein Pfad auf der eigenen Seite:
 *   "/passwort-neu"      erlaubt
 *   "//example.com"      verboten (schema-relative fremde Adresse)
 *   "/\example.com"      verboten (Browser lesen \ teils wie /)
 *   "https://example.com" verboten
 */
export function sicheresZiel(weiter: string | null, standard = "/dashboard"): string {
  if (!weiter) return standard;
  return /^\/[^/\\]/.test(weiter) ? weiter : standard;
}
