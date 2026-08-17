/**
 * Geldbeträge werden im gesamten Projekt als ganzzahlige Cent geführt.
 * Fließkommazahlen sind für Geld ungeeignet (0.1 + 0.2 !== 0.3) und
 * führen bei Provisionsberechnungen zu Rundungsfehlern, die echtes Geld kosten.
 */

/** Provision des Marktplatzbetreibers in Prozent. */
export const PROVISION_PROZENT = 20;

/** Kleinster erlaubter Verkaufspreis (Stripe-Mindestbetrag für EUR). */
export const MIN_PREIS_CENT = 100;

/** Obergrenze, um Tippfehler wie "10000 €" statt "100 €" abzufangen. */
export const MAX_PREIS_CENT = 500_000;

const euroFormat = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

/** Formatiert Cent als deutschen Eurobetrag, z. B. 1990 -> "19,90 €". */
export function formatEuro(cent: number): string {
  return euroFormat.format(cent / 100);
}

/**
 * Wandelt eine Benutzereingabe in Euro (z. B. "19,90" oder "19.90") in Cent um.
 * Gibt null zurück, wenn die Eingabe kein gültiger Betrag ist.
 */
export function euroStringZuCent(eingabe: string): number | null {
  const bereinigt = eingabe.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(bereinigt)) return null;

  // Über Strings runden statt über Multiplikation, damit z. B. "19.99"
  // nicht als 1998.9999999999998 endet.
  const [ganz, bruch = ""] = bereinigt.split(".");
  const cent = Number(ganz) * 100 + Number(bruch.padEnd(2, "0"));
  return Number.isSafeInteger(cent) ? cent : null;
}

/**
 * Provisionsanteil des Betreibers an einem Verkauf.
 * Wird abgerundet, damit der Verkäufer nie weniger bekommt als vereinbart.
 */
export function provisionCent(betragCent: number): number {
  return Math.floor((betragCent * PROVISION_PROZENT) / 100);
}

/** Auszahlungsbetrag des Verkäufers vor Stripe-Gebühren. */
export function verkaeuferAnteilCent(betragCent: number): number {
  return betragCent - provisionCent(betragCent);
}
