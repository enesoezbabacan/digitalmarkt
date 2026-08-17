import { NextResponse } from "next/server";

import { sitzungBeenden } from "@/lib/sitzung";

/**
 * Sitzung beenden.
 *
 * Als Route Handler und nicht in der Seite selbst: Next.js erlaubt das Ändern
 * von Cookies nur in Server Actions und Route Handlern. Beim Rendern einer
 * Seite führt es zu einem Serverfehler.
 *
 * Hierher wird auch umgeleitet, wenn ein Cookie auf einen Verkäufer zeigt,
 * den es nicht mehr gibt — sonst hängt der Nutzer in einer Fehlerschleife fest.
 */
export async function GET(anfrage: Request) {
  await sitzungBeenden();
  return NextResponse.redirect(new URL("/anmelden", anfrage.url));
}
