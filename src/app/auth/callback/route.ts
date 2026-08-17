import { NextResponse } from "next/server";

import { supabaseServer } from "@/lib/supabase/server";
import { sicheresZiel } from "@/lib/weiterleitung";

/**
 * Landepunkt für den Link aus der Bestätigungsmail.
 *
 * Supabase hängt an die Rückkehr-Adresse einen einmaligen `code`. Erst der
 * Tausch gegen eine Sitzung meldet den Nutzer wirklich an — deshalb muss das
 * hier in einem Route Handler passieren und nicht beim Rendern einer Seite:
 * nur hier dürfen Cookies gesetzt werden.
 */
export async function GET(anfrage: Request) {
  const adresse = new URL(anfrage.url);
  const code = adresse.searchParams.get("code");
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
  }

  // Ziel nach dem Anmelden — siehe sicheresZiel: nur eigene Pfade.
  const ziel = sicheresZiel(adresse.searchParams.get("next"));

  return NextResponse.redirect(new URL(ziel, adresse.origin));
}
