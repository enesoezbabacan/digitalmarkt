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

  const konto = await stripe().accounts.retrieve(stripeKontoId);

  return {
    verbunden: true,
    auszahlungBereit: konto.charges_enabled && konto.payouts_enabled,
    // Übersetzt: Stripe liefert technische Feldnamen wie "individual.dob.day".
    // Ungefiltert angezeigt steht der Verkäufer vor einer Zeile englischer
    // Datenbankfelder — ausgerechnet dort, wo es um seine Auszahlung geht.
    offenePunkte: anforderungenLesbar(konto.requirements?.currently_due ?? []),
  };
}
