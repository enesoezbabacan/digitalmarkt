import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase-Client für die Serverseite.
 *
 * Verwendet den öffentlichen Schlüssel (publishable/anon) und die Sitzung des
 * angemeldeten Nutzers. Der Zugriff wird dadurch von Row Level Security in der
 * Datenbank geregelt — nicht vom Anwendungscode. Das ist der entscheidende
 * Unterschied zur lokalen Datenschicht: Selbst ein Fehler in einer Abfrage
 * kann keine fremden Daten herausgeben, weil die Datenbank sie gar nicht
 * erst liefert.
 *
 * Der service_role-Schlüssel wird hier bewusst NICHT benutzt. Er umgeht RLS
 * vollständig und ist erst in Phase 2 nötig, wenn der Stripe-Webhook ohne
 * angemeldeten Nutzer Bestellungen schreiben muss.
 */
export async function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const schluessel = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !schluessel) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL oder NEXT_PUBLIC_SUPABASE_ANON_KEY fehlt in " +
        ".env.local. Siehe .env.example.",
    );
  }

  const speicher = await cookies();

  return createServerClient(url, schluessel, {
    cookies: {
      getAll: () => speicher.getAll(),
      setAll: (zuSetzen) => {
        try {
          for (const { name, value, options } of zuSetzen) {
            speicher.set(name, value, options);
          }
        } catch {
          // Beim Rendern einer Seite lassen sich keine Cookies setzen — das
          // erlaubt Next.js nur in Server Actions und Route Handlern.
          // Die Sitzung wird dort aufgefrischt; hier ist das Übergehen richtig
          // und kein Fehler.
        }
      },
    },
  });
}
