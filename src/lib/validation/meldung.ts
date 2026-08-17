import { z } from "zod";

/**
 * Prüfung einer Meldung nach Art. 16 DSA.
 *
 * Die Vorschrift verlangt, dass jede Person eine Rechtsverletzung melden kann —
 * ohne Konto, ohne Anmeldung. Sie verlangt aber auch, dass die Meldung
 * "hinreichend präzise und begründet" ist. Beides zusammen ergibt die Regeln
 * hier: niedrige Hürde beim Zugang, klare Anforderungen an den Inhalt.
 *
 * Die Bestätigung nach bestem Wissen (Art. 16 Abs. 2 lit. d) ist Pflicht. Ohne
 * sie ist die Meldung unvollständig, und der Betreiber muss sie nicht wie eine
 * ordnungsgemäße Meldung behandeln.
 */

export const MELDEGRUENDE = [
  "Urheberrechtsverletzung",
  "Markenrechtsverletzung",
  "Irreführende oder falsche Angaben",
  "Rechtswidriger Inhalt",
  "Gefälschtes oder nicht geliefertes Produkt",
  "Sonstiges",
] as const;

export const meldungSchema = z.object({
  produkt_id: z.string().uuid("Bitte wähle das betroffene Produkt aus."),

  melder_email: z
    .string()
    .trim()
    .min(1, "Bitte gib deine E-Mail-Adresse an.")
    .email("Das sieht nicht nach einer gültigen E-Mail-Adresse aus.")
    .max(200),

  // Freiwillig: Art. 16 verlangt den Namen nicht, und bei Meldungen zu
  // Straftaten gegen Leib und Leben ist die anonyme Meldung sogar ausdrücklich
  // vorgesehen. Die E-Mail brauchen wir dagegen für die Eingangsbestätigung
  // und die Mitteilung der Entscheidung.
  melder_name: z.string().trim().max(120).optional(),

  // Ohne eigene Meldung zeigt zod hier seinen englischen Rohtext samt
  // Aufzählung aller erlaubten Werte — für einen Melder unbrauchbar.
  kategorie: z.enum(MELDEGRUENDE, {
    message: "Bitte wähle aus, worum es geht.",
  }),

  begruendung: z
    .string()
    .trim()
    .min(
      20,
      "Bitte beschreibe mit mindestens 20 Zeichen, worin die Rechtsverletzung liegt.",
    )
    .max(5000, "Die Begründung ist zu lang (maximal 5000 Zeichen)."),

  // Art. 16 Abs. 2 lit. d DSA
  richtigkeit_bestaetigt: z.literal(true, {
    message:
      "Bitte bestätige, dass deine Angaben nach bestem Wissen richtig und vollständig sind.",
  }),
});

export type MeldungEingabe = z.infer<typeof meldungSchema>;

/**
 * Setzt Kategorie und Freitext zu dem Text zusammen, der gespeichert wird.
 *
 * Die Datenbank hat nur ein Feld `grund`. Die Kategorie voranzustellen macht
 * die Liste im Betreiber-Bereich auf einen Blick lesbar, ohne dafür eine
 * Migration zu brauchen.
 */
export function grundText(kategorie: string, begruendung: string): string {
  return `[${kategorie}] ${begruendung}`;
}
