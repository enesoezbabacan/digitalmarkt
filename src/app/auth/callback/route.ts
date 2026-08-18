import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { supabaseServer } from "@/lib/supabase/server";
import { sicheresZiel } from "@/lib/weiterleitung";

/**
 * Landepunkt für den Link aus der Bestätigungsmail.
 *
 * Erst der Tausch gegen eine Sitzung meldet den Nutzer wirklich an — deshalb
 * muss das hier in einem Route Handler passieren und nicht beim Rendern einer
 * Seite: nur hier dürfen Cookies gesetzt werden.
 *
 * Supabase kennt dafür ZWEI Formen, und die Mailvorlage entscheidet, welche
 * ankommt:
 *
 *   ?code=…                      — der PKCE-Weg
 *   ?token_hash=…&type=recovery  — der Weg der Standardvorlagen
 *
 * Nur den ersten zu behandeln hat gereicht, solange es bloss die
 * Registrierungsmail gab. Beim Passwort-Zuruecksetzen kommt die zweite Form,
 * und der Link lief still ins Leere: keine Sitzung, also warf /passwort-neu
 * zurueck auf die Anmeldung — mit derselben Fehlermeldung wie bei einem
 * falschen Passwort. Deshalb hier beide Formen.
 */
const ERLAUBTE_TYPEN: EmailOtpType[] = [
  "recovery",
  "signup",
  "invite",
  "email_change",
  "magiclink",
];

export async function GET(anfrage: Request) {
  const adresse = new URL(anfrage.url);
  const code = adresse.searchParams.get("code");
  const tokenHash = adresse.searchParams.get("token_hash");
  const typ = adresse.searchParams.get("type");
  const fehler = adresse.searchParams.get("error_description");

  if (fehler) {
    return NextResponse.redirect(new URL("/anmelden?fehler=1", adresse.origin));
  }

  if (code) {
    const sb = await supabaseServer();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL("/anmelden?fehler=1", adresse.origin));
    }
  } else if (tokenHash && typ && ERLAUBTE_TYPEN.includes(typ as EmailOtpType)) {
    const sb = await supabaseServer();
    const { error } = await sb.auth.verifyOtp({
      token_hash: tokenHash,
      type: typ as EmailOtpType,
    });
    if (error) {
      return NextResponse.redirect(new URL("/anmelden?fehler=1", adresse.origin));
    }
  }

  // Ziel nach dem Anmelden — siehe sicheresZiel: nur eigene Pfade.
  const ziel = sicheresZiel(adresse.searchParams.get("next"));

  return NextResponse.redirect(new URL(ziel, adresse.origin));
}
