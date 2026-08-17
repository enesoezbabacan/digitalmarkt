import { NextResponse } from "next/server";

/**
 * Rückkehr-Adresse nach abgeschlossenem (oder abgebrochenem) Stripe-Onboarding.
 *
 * Stripe garantiert an dieser Stelle NICHT, dass die Verifizierung wirklich
 * fertig ist — nur, dass der Verkäufer den Flow durchlaufen hat. Der
 * tatsächliche Status wird im Dashboard live bei Stripe abgefragt
 * (siehe src/app/dashboard/page.tsx), nie aus einem hier gesetzten Zustand
 * übernommen.
 */
export async function GET(anfrage: Request) {
  return NextResponse.redirect(new URL("/dashboard?stripe=zurueck", anfrage.url));
}
