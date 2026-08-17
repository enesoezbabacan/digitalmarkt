import { z } from "zod";

/**
 * Verkäuferdaten nach Art. 30 DSA (Nachverfolgbarkeit von Unternehmern).
 * Ohne diese Angaben darf kein Produkt eingestellt werden.
 *
 * Diese Prüfungen laufen IMMER serverseitig. Die gleiche Datei wird auch im
 * Browser benutzt, aber nur für sofortige Rückmeldung — Schutz ist sie dort nicht.
 */

/**
 * Muster, die keine ladungsfähige Anschrift darstellen.
 * Ein Postfach reicht nach § 5 DDG und Art. 30 DSA nicht aus, weil dorthin
 * keine Klage zugestellt werden kann.
 */
const KEINE_LADUNGSFAEHIGE_ANSCHRIFT = [
  /\bpostfach\b/i,
  /\bpost\s*fach\b/i,
  /\bp\.?\s*o\.?\s*box\b/i,
  /\bpostbox\b/i,
  /\bpostlagernd\b/i,
  /\bpackstation\b/i,
  /\bpostfiliale\b/i,
  /\bboîte\s+postale\b/i,
  /\bcasella\s+postale\b/i,
  /^\s*pf[\s.:-]+\d/i,
];

/** PLZ-Formate der Länder, die wir zum Start zulassen. */
const PLZ_MUSTER: Record<string, { muster: RegExp; beispiel: string }> = {
  DE: { muster: /^\d{5}$/, beispiel: "12345" },
  AT: { muster: /^\d{4}$/, beispiel: "1010" },
  CH: { muster: /^\d{4}$/, beispiel: "8001" },
  NL: { muster: /^\d{4}\s?[A-Za-z]{2}$/, beispiel: "1012 AB" },
  BE: { muster: /^\d{4}$/, beispiel: "1000" },
  LU: { muster: /^\d{4}$/, beispiel: "1111" },
  FR: { muster: /^\d{5}$/, beispiel: "75001" },
  IT: { muster: /^\d{5}$/, beispiel: "00100" },
  ES: { muster: /^\d{5}$/, beispiel: "28001" },
  PL: { muster: /^\d{2}-\d{3}$/, beispiel: "00-001" },
};

export const ERLAUBTE_LAENDER = Object.keys(PLZ_MUSTER);

export const LAENDER_NAMEN: Record<string, string> = {
  DE: "Deutschland",
  AT: "Österreich",
  CH: "Schweiz",
  NL: "Niederlande",
  BE: "Belgien",
  LU: "Luxemburg",
  FR: "Frankreich",
  IT: "Italien",
  ES: "Spanien",
  PL: "Polen",
};

/** Prüft, ob eine Straßenangabe ein Postfach o. Ä. ist. */
export function istPostfach(strasse: string): boolean {
  return KEINE_LADUNGSFAEHIGE_ANSCHRIFT.some((muster) => muster.test(strasse));
}

/** Eine ladungsfähige Anschrift braucht eine Hausnummer. */
export function hatHausnummer(strasse: string): boolean {
  return /\d/.test(strasse);
}

export const verkaeuferSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Bitte gib deinen vollständigen Namen oder Firmennamen an.")
      .max(120, "Der Name ist zu lang (maximal 120 Zeichen)."),

    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Das sieht nicht nach einer gültigen E-Mail-Adresse aus."),

    telefon: z
      .string()
      .trim()
      .min(6, "Bitte gib eine erreichbare Telefonnummer an.")
      .max(40, "Die Telefonnummer ist zu lang.")
      .regex(
        /^[+()\d][\d\s/().-]*$/,
        "Die Telefonnummer darf nur Ziffern und die Zeichen + ( ) / - . enthalten.",
      ),

    strasse: z
      .string()
      .trim()
      .min(3, "Bitte gib Straße und Hausnummer an.")
      .max(120, "Die Straßenangabe ist zu lang.")
      .refine(
        (wert) => !istPostfach(wert),
        "Ein Postfach oder eine Packstation reicht nicht aus. Wir brauchen eine ladungsfähige Anschrift mit Straße und Hausnummer.",
      )
      .refine(
        hatHausnummer,
        "Bitte gib auch die Hausnummer an, zum Beispiel: Musterstraße 12a.",
      ),

    plz: z.string().trim().min(3, "Bitte gib die Postleitzahl an.").max(10),

    ort: z
      .string()
      .trim()
      .min(2, "Bitte gib den Ort an.")
      .max(80, "Der Ort ist zu lang."),

    land: z.enum(ERLAUBTE_LAENDER as [string, ...string[]], {
      message: "Bitte wähle ein Land aus der Liste.",
    }),

    // Pflicht nach Art. 30 DSA — ohne Steuernummer kein Produkt-Upload.
    steuernummer: z
      .string()
      .trim()
      .min(5, "Die Steuernummer ist Pflicht. Ohne sie darfst du hier nichts verkaufen.")
      .max(30, "Die Steuernummer ist zu lang."),

    // Optional. Wenn angegeben, wird sie gegen die EU-Datenbank (VIES) geprüft.
    ust_id: z
      .string()
      .trim()
      .toUpperCase()
      .regex(
        /^[A-Z]{2}[A-Z0-9]{2,12}$/,
        "Eine USt-IdNr. beginnt mit dem Länderkürzel, zum Beispiel DE123456789.",
      )
      .optional()
      .or(z.literal("")),

    rechte_bestaetigt: z.literal(true, {
      message:
        "Du musst bestätigen, dass du die Rechte an den Inhalten hältst, die du verkaufst.",
    }),

    // Bewusst getrennt vom Rechtehäkchen, nicht zusammengelegt: Das eine ist
    // eine Zusicherung über die Inhalte, das andere die Annahme eines
    // Vertrags. In ein Häkchen gebündelt wäre beides angreifbar.
    bedingungen_akzeptiert: z.literal(true, {
      message:
        "Du musst den Allgemeinen Geschäftsbedingungen und dem Verkäufervertrag zustimmen.",
    }),
  })
  .superRefine((daten, ctx) => {
    const regel = PLZ_MUSTER[daten.land];
    if (regel && !regel.muster.test(daten.plz)) {
      ctx.addIssue({
        code: "custom",
        path: ["plz"],
        message: `Die Postleitzahl passt nicht zu ${LAENDER_NAMEN[daten.land]}. Beispiel: ${regel.beispiel}`,
      });
    }

    // Wer eine USt-IdNr. angibt, muss sie aus demselben Land angeben.
    if (daten.ust_id && !daten.ust_id.startsWith(daten.land)) {
      ctx.addIssue({
        code: "custom",
        path: ["ust_id"],
        message: `Die USt-IdNr. muss mit ${daten.land} beginnen, weil das dein Sitzland ist.`,
      });
    }
  });

export type VerkaeuferEingabe = z.infer<typeof verkaeuferSchema>;

/**
 * Prüft, ob ein Verkäufer alle DSA-Pflichtangaben hinterlegt hat.
 * Wird vor jedem Produkt-Upload serverseitig aufgerufen — ein ausgeblendeter
 * Button im Frontend ist kein Schutz.
 */
export function dsaAngabenVollstaendig(verkaeufer: {
  name?: string | null;
  telefon?: string | null;
  strasse?: string | null;
  plz?: string | null;
  ort?: string | null;
  land?: string | null;
  steuernummer?: string | null;
}): { ok: boolean; fehlend: string[] } {
  const pflicht: Array<[keyof typeof verkaeufer, string]> = [
    ["name", "Name"],
    ["telefon", "Telefonnummer"],
    ["strasse", "Straße und Hausnummer"],
    ["plz", "Postleitzahl"],
    ["ort", "Ort"],
    ["land", "Land"],
    ["steuernummer", "Steuernummer"],
  ];

  const fehlend = pflicht
    .filter(([feld]) => !verkaeufer[feld]?.toString().trim())
    .map(([, bezeichnung]) => bezeichnung);

  // Eine nachträglich auf ein Postfach geänderte Adresse muss ebenfalls greifen.
  if (verkaeufer.strasse && istPostfach(verkaeufer.strasse)) {
    fehlend.push("ladungsfähige Anschrift (Postfach reicht nicht)");
  }

  return { ok: fehlend.length === 0, fehlend };
}
