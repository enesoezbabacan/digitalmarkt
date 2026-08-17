import { createClient } from "@supabase/supabase-js";

/**
 * Supabase-Client mit dem service_role-Schlüssel.
 *
 * WARNUNG: Dieser Client umgeht Row Level Security vollständig. Er darf
 * ausschließlich für die wenigen Operationen verwendet werden, die absichtlich
 * außerhalb der normalen Nutzerrechte liegen — zum Beispiel das Speichern der
 * stripe_account_id (siehe supabase/migrations/0001_init.sql, Trigger
 * sellers_geschuetzte_felder) oder das Anlegen von Bestellungen durch den
 * Stripe-Webhook, der ohne angemeldeten Nutzer läuft.
 *
 * Niemals für gewöhnliche Datenbankzugriffe verwenden — dafür ist
 * src/lib/supabase/server.ts da, das die Rechte des jeweiligen Nutzers
 * respektiert.
 */
export function supabaseService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const schluessel = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !schluessel) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY fehlt in " +
        ".env.local. Siehe .env.example.",
    );
  }

  return createClient(url, schluessel, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
