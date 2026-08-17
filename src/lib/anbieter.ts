/**
 * Angaben zum Anbieter des Marktplatzes.
 *
 * Eine einzige Stelle für alles, was in Impressum, Datenschutzerklärung, AGB
 * und Widerrufsbelehrung auftaucht. Diese Angaben stehen an vielen Stellen —
 * sie an jeder einzeln zu pflegen ist der sichere Weg zu Widersprüchen, und
 * widersprüchliche Pflichtangaben sind ein Abmahngrund.
 *
 * ACHTUNG: Was hier `null` ist, FEHLT noch. Die Rechtstexte weisen darauf
 * sichtbar hin, statt die Lücke stillschweigend zu überspringen.
 */

export const ANBIETER = {
  /** Vor- und Zuname — beim Einzelunternehmen die maßgebliche Angabe. */
  name: "Enes Özbabacan",

  /**
   * Geschäftsbezeichnung — ein Zusatz, nicht der Name des Unternehmens.
   *
   * Ohne Eintrag im Handelsregister gibt es keine "Firma" im Rechtssinn. Der
   * maßgebliche Name bleibt der Personenname; "Select-Prime" darf danebenstehen,
   * aber nie an seiner Stelle. Deshalb steht in Impressum, AGB,
   * Datenschutzerklärung und auf jeder Rechnung immer zuerst `name`.
   *
   * Was hier nie hineingehört: ein Zusatz, der eine andere Rechtsform
   * vortäuscht (GmbH, & Co., e. K.). Das wäre irreführend und angreifbar.
   */
  geschaeftsbezeichnung: "Select-Prime",

  rechtsform: "Einzelunternehmen",

  strasse: "Schillerstraße 3",
  plz: "78234",
  ort: "Engen",
  land: "Deutschland",

  email: "enes@select-prime.de",

  /**
   * Pflichtangabe nach § 5 Abs. 1 Nr. 2 DDG: eine Angabe, die "eine schnelle
   * elektronische Kontaktaufnahme und unmittelbare Kommunikation ermöglicht".
   * Der EuGH lässt statt der Telefonnummer auch andere unmittelbare Wege zu,
   * die sichere Variante ist aber die Telefonnummer.
   */
  telefon: "+49 160 4666669" as string | null,

  /**
   * USt-IdNr. nach § 27a UStG. Nur anzugeben, WENN vorhanden.
   *
   * Als Kleinunternehmer nach § 19 UStG braucht man keine und hat in aller
   * Regel auch keine. Die Steuernummer gehört NICHT ins Impressum — das ist
   * ein weit verbreiteter Irrtum. Sie ist eine nicht-öffentliche Angabe und
   * gehört auf Rechnungen, nicht auf die Website.
   */
  ustIdNr: null as string | null,

  /** Zuständige Aufsichtsbehörde für den Datenschutz (Sitz des Anbieters). */
  datenschutzAufsicht: {
    name: "Der Landesbeauftragte für den Datenschutz und die Informationsfreiheit Baden-Württemberg",
    anschrift: "Lautenschlagerstraße 20, 70173 Stuttgart",
    web: "www.baden-wuerttemberg.datenschutz.de",
  },

  /** Domain, unter der der Marktplatz erreichbar ist. */
  domain: "markt.select-prime.de",
} as const;

/** Anschrift in einer Zeile, für Fließtext. */
export function anschriftEinzeilig(): string {
  return `${ANBIETER.strasse}, ${ANBIETER.plz} ${ANBIETER.ort}`;
}

/**
 * Pflichtangaben, die noch fehlen.
 *
 * Wird oben auf den Rechtstexten angezeigt, solange etwas offen ist. Ein
 * unvollständiges Impressum ist der häufigste Abmahngrund überhaupt — es darf
 * nicht passieren, dass die Lücke erst jemandem von außen auffällt.
 */
export function fehlendeAngaben(): string[] {
  const fehlt: string[] = [];
  if (!ANBIETER.telefon) fehlt.push("Telefonnummer (§ 5 Abs. 1 Nr. 2 DDG)");
  return fehlt;
}
