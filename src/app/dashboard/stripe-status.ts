import { stripe } from "@/lib/stripe";
import { anforderungenLesbar } from "@/lib/stripe-anforderungen";

export type StripeStatus =
  | { verbunden: false }
  | { verbunden: true; auszahlungBereit: boolean; offenePunkte: string[] };

/**
 * Fragt den Verifizierungsstatus live bei Stripe ab.
 *
 * Bewusst kein lokal gespeichertes Flag: Stripe kann eine Verifizierung
 * jederzeit nachträglich für ungültig erklären (z. B. bei Rückbuchungen oder
 * neuen Anforderungen). Ein zwischengespeicherter Status könnte dann veraltet
 * "bereit" anzeigen, obwohl Auszahlungen längst gesperrt sind.
 */
export async function stripeStatusLaden(
  stripeKontoId: string | null,
): Promise<StripeStatus> {
  if (!stripeKontoId) return { verbunden: false };

  // Eine gespeicherte Kontonummer heisst nicht, dass Stripe sie noch kennt.
  // Beim Wechsel vom Test- in den Echtbetrieb bleibt die alte Nummer stehen,
  // gehoert dort aber zu einem anderen Stripe-Konto. Ohne diesen Fang wirft
  // der Abruf, und der Verkaeufer sieht statt seines Bereichs eine
  // Fehlerseite — ausgerechnet dort, wo er das Problem beheben koennte.
  // "Nicht verbunden" ist hier die ehrliche Antwort: aus Sicht des
  // Echtbetriebs gibt es dieses Konto tatsaechlich nicht.
  let konto;
  try {
    konto = await stripe().accounts.retrieve(stripeKontoId);
  } catch {
    return { verbunden: false };
  }

  return {
    verbunden: true,
    auszahlungBereit: konto.charges_enabled && konto.payouts_enabled,
    // Übersetzt: Stripe liefert technische Feldnamen wie "individual.dob.day".
    // Ungefiltert angezeigt steht der Verkäufer vor einer Zeile englischer
    // Datenbankfelder — ausgerechnet dort, wo es um seine Auszahlung geht.
    offenePunkte: anforderungenLesbar(konto.requirements?.currently_due ?? []),
  };
}
