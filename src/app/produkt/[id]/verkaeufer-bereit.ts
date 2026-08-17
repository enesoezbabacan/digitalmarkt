import { supabaseService } from "@/lib/supabase/service";
import { stripe } from "@/lib/stripe";

/**
 * Zahlungsfähigkeit eines Verkäufers — für Anzeige UND Kauf.
 *
 * WARUM DAS HIER LIEGT UND NICHT IN db().verkaeufer()
 *
 * Ein Käufer ist nicht angemeldet. Row Level Security erlaubt auf `sellers`
 * ausschließlich die eigene Zeile (id = auth.uid()), also sieht ein Gast dort
 * GAR NICHTS. Wer für den Kauf db().verkaeufer() benutzt, bekommt null zurück
 * und bricht mit "Verkäufer kann keine Zahlungen empfangen" ab — obwohl alles
 * in Ordnung ist.
 *
 * Genau dieser Fehler war einmal drin: Der Kauf-Button wurde angezeigt (die
 * Prüfung hier las korrekt über service_role), aber der Kauf selbst schlug
 * fehl. Kein Gast hätte etwas kaufen können.
 *
 * Deshalb geht beides — Anzeige und Kauf — durch dieselbe Funktion. Gelesen
 * wird über den service_role-Client, aber ausschließlich stripe_account_id und
 * status; nichts Personenbezogenes verlässt diese Datei.
 */

export type Zahlungskonto = {
  stripeKontoId: string;
  bereit: boolean;
};

export async function verkaeuferZahlungskonto(
  verkaeuferId: string,
): Promise<Zahlungskonto | null> {
  const { data } = await supabaseService()
    .from("sellers")
    .select("stripe_account_id, status")
    .eq("id", verkaeuferId)
    .maybeSingle();

  if (!data?.stripe_account_id || data.status === "suspended") return null;

  try {
    const konto = await stripe().accounts.retrieve(data.stripe_account_id);
    return {
      stripeKontoId: data.stripe_account_id,
      bereit: konto.charges_enabled === true,
    };
  } catch {
    // Stripe nicht erreichbar: lieber keinen Kauf anbieten, als einen Kauf
    // anzunehmen, der nicht ausgezahlt werden kann.
    return null;
  }
}

/** Steuert, ob der Kauf-Button überhaupt angeboten wird. */
export async function verkaeuferKannZahlungenEmpfangen(
  verkaeuferId: string,
): Promise<boolean> {
  const konto = await verkaeuferZahlungskonto(verkaeuferId);
  return konto?.bereit === true;
}
