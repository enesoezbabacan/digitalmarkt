/**
 * Hinweistext unter dem Preis.
 *
 * Die Preisangabenverordnung verlangt eine zutreffende Angabe darüber, ob
 * Umsatzsteuer im Preis enthalten ist. Ein pauschales "inkl. USt." ist auf
 * einem Marktplatz falsch, sobald ein Verkäufer Kleinunternehmer nach
 * § 19 UStG ist — der weist keine aus.
 *
 * Deshalb hängt der Text am jeweiligen Verkäufer, nicht am Betreiber.
 */
export function preisHinweis(kleinunternehmer: boolean): string {
  return kleinunternehmer
    ? "Gesamtpreis, kein USt.-Ausweis (§ 19 UStG)"
    : "inkl. USt.";
}

/** Ausführlichere Fassung für die Produktseite. */
export function preisHinweisLang(kleinunternehmer: boolean): string {
  return kleinunternehmer
    ? "Gesamtpreis. Der Verkäufer ist Kleinunternehmer nach § 19 UStG und weist keine Umsatzsteuer aus. Keine weiteren Kosten."
    : "Gesamtpreis inkl. gesetzlicher Umsatzsteuer. Keine weiteren Kosten.";
}

/**
 * Hinweis auf die steuerliche Absetzbarkeit.
 *
 * Bewusst ohne Prozentzahl. Wie viel jemand tatsächlich spart, hängt von
 * seinem persönlichen Steuersatz ab — eine feste Zahl wie "ein Drittel" wäre
 * für einen Teil der Käufer schlicht falsch, und eine falsche Zahl in der
 * Werbung ist angreifbar.
 *
 * Der Zusatz "sofern betrieblich veranlasst" ist der Grund, warum der Satz
 * immer stimmt: Er nennt genau die Bedingung, unter der die Ausgabe
 * abziehbar ist, statt sie zu unterschlagen.
 */
export const ABSETZBAR_HINWEIS =
  "Für Selbstständige und Unternehmen in der Regel als Betriebsausgabe absetzbar, sofern betrieblich veranlasst. Über den Einzelfall entscheidet dein Steuerberater.";
