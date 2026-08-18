import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { absolut } from "@/lib/seo";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Passwort vergessen" };

export const dynamic = "force-dynamic";

/**
 * Fordert den Wiederherstellungslink an.
 *
 * Supabase schickt eine Mail mit einem einmaligen Code. Der Link zeigt auf
 * /auth/callback, wo der Code gegen eine Sitzung getauscht wird; von dort
 * geht es weiter zu /passwort-neu. Ohne diese Seite hier gibt es gar keinen
 * Weg, den Link überhaupt auszulösen — /passwort-neu allein ist nutzlos.
 */
async function anfordern(formular: FormData) {
  "use server";

  const email = (formular.get("email") ?? "").toString().trim();
  if (!email) redirect("/passwort-vergessen?fehler=1");

  const sb = await supabaseServer();
  await sb.auth.resetPasswordForEmail(email, {
    redirectTo: absolut("/auth/callback?next=/passwort-neu"),
  });

  // Bewusst immer dieselbe Bestätigung, auch wenn die Adresse unbekannt ist.
  // Sonst liesse sich hier durchprobieren, wer ein Konto hat.
  redirect("/passwort-vergessen?gesendet=1");
}

// Die generierten Routen-Typen kennen diese Seite erst nach dem naechsten
// Build. Deshalb hier die Form der Suchparameter direkt hinschreiben.
export default async function PasswortVergessen({
  searchParams,
}: {
  searchParams: Promise<{ gesendet?: string; fehler?: string }>;
}) {
  const { gesendet, fehler } = await searchParams;

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-3xl font-semibold tracking-tight">
        Passwort vergessen
      </h1>
      <p className="mt-2 text-neutral-600">
        Trag deine E-Mail-Adresse ein. Wir schicken dir einen Link, mit dem du
        ein neues Passwort vergeben kannst.
      </p>

      {gesendet ? (
        <p className="mt-6 rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-900">
          Wenn es zu dieser Adresse ein Konto gibt, ist die E-Mail unterwegs.
          Schau auch im Spam-Ordner nach.
        </p>
      ) : (
        <form action={anfordern} className="mt-8 space-y-4">
          {fehler && (
            <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
              Bitte gib eine E-Mail-Adresse ein.
            </p>
          )}

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              E-Mail-Adresse
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-md border border-neutral-300 px-3 py-2"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-neutral-900 px-4 py-3 font-medium text-white hover:bg-neutral-700"
          >
            Link anfordern
          </button>
        </form>
      )}

      <p className="mt-6 text-sm text-neutral-600">
        <Link href="/anmelden" className="font-medium underline">
          Zurück zur Anmeldung
        </Link>
      </p>
    </div>
  );
}
