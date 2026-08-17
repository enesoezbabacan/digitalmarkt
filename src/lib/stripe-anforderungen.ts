/**
 * Übersetzt Stripes Anforderungscodes in verständliches Deutsch.
 *
 * Stripe liefert offene Punkte als technische Feldnamen: "individual.dob.day",
 * "business_profile.mcc", "tos_acceptance.ip". Diese ungefiltert anzuzeigen
 * bedeutet, dass ein Verkäufer eine Zeile englischer Datenbankfelder vor sich
 * hat und nicht weiß, was er tun soll — ausgerechnet an der Stelle, an der es
 * um sein Geld geht.
 *
 * Mehrere Codes zeigen auf dieselbe Sache (dob.day, dob.month, dob.year sind
 * ein Geburtsdatum). Deshalb wird zusammengefasst und doppelt Genanntes
 * entfernt.
 */

const UEBERSETZUNG: Array<[RegExp, string]> = [
  [/^individual\.dob\./, "Geburtsdatum"],
  [/^individual\.address\./, "Wohnanschrift"],
  [/^individual\.(first_name|last_name)$/, "Name"],
  [/^individual\.email$/, "E-Mail-Adresse"],
  [/^individual\.phone$/, "Telefonnummer"],
  [/^individual\.id_number$/, "Ausweis- oder Steuernummer"],
  [/^individual\.verification\.document/, "Ausweisdokument"],
  [/^individual\.verification\.additional_document/, "zusätzlicher Nachweis"],
  [/^individual\./, "Angaben zu deiner Person"],

  [/^company\.address\./, "Anschrift des Unternehmens"],
  [/^company\.name$/, "Name des Unternehmens"],
  [/^company\.tax_id$/, "Steuernummer"],
  [/^company\./, "Angaben zum Unternehmen"],

  [/^business_profile\.mcc$/, "Branche"],
  [/^business_profile\.url$/, "Adresse deiner Website"],
  [/^business_profile\.product_description$/, "Beschreibung, was du verkaufst"],
  [/^business_profile\./, "Angaben zu deiner Tätigkeit"],

  [/^external_account$/, "Bankverbindung"],
  [/^bank_account/, "Bankverbindung"],
  [/^tos_acceptance\./, "Zustimmung zu den Stripe-Nutzungsbedingungen"],
  [/^settings\./, "Kontoeinstellungen bei Stripe"],
  [/^representative/, "Angaben zur vertretungsberechtigten Person"],
];

/**
 * Macht aus Stripes Codeliste eine kurze, lesbare Aufzählung.
 *
 * Unbekannte Codes werden NICHT verschluckt, sondern durchgereicht — lieber
 * ein technischer Begriff zu viel als ein stillschweigend verschwiegener
 * Punkt, der die Auszahlung blockiert.
 */
export function anforderungenLesbar(codes: string[]): string[] {
  const gesehen = new Set<string>();
  const ergebnis: string[] = [];

  for (const code of codes) {
    const treffer = UEBERSETZUNG.find(([muster]) => muster.test(code));
    const text = treffer ? treffer[1] : code;
    if (!gesehen.has(text)) {
      gesehen.add(text);
      ergebnis.push(text);
    }
  }

  return ergebnis;
}
