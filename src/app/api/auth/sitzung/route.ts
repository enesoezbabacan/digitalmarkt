import { NextResponse } from "next/server";

import { supabaseServer } from "@/lib/supabase/server";

/**
 * Übernimmt eine Anmeldung, die im URL-Anker ankommt, in die Server-Sitzung.
 *
 * Hintergrund: Supabase hängt die Anmeldedaten eines Wiederherstellungs- oder
 * Bestätigungslinks hinter ein `#` an die Adresse. Alles hinter dem `#` bleibt
 * im Browser — der Server bekommt es nie zu sehen. Ohne diesen Umweg wäre der
 * Nutzer im Browser angemeldet, für den Server aber ein Fremder, und Seiten
 * wie /dashboard oder /admin blieben verschlossen.
 *
 * Die Seite /auth/sitzung liest den Anker aus und schickt die Werte hierher.
 * Geprüft werden sie von Supabase selbst: setSession lehnt gefälschte oder
 * abgelaufene Token ab. Ein erratener Wert nützt also nichts.
 */
export async function POST(anfrage: Request) {
  let daten: unknown;
  try {
    daten = await anfrage.json();
  } catch {
    return NextResponse.json({ fehler: "Ungültige Anfrage." }, { status: 400 });
  }

  const { access_token, refresh_token } = (daten ?? {}) as Record<string, unknown>;

  if (typeof access_token !== "string" || typeof refresh_token !== "string") {
    return NextResponse.json({ fehler: "Anmeldedaten fehlen." }, { status: 400 });
  }

  const sb = await supabaseServer();
  const { error } = await sb.auth.setSession({ access_token, refresh_token });

  if (error) {
    return NextResponse.json(
      { fehler: "Der Link ist abgelaufen oder wurde schon benutzt." },
      { status: 401 },
    );
  }

  return NextResponse.json({ ok: true });
}
