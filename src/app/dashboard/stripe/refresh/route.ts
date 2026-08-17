import { NextResponse } from "next/server";

/**
 * Stripe ruft diese Adresse auf, wenn ein Onboarding-Link abgelaufen ist.
 * Wir schicken den Verkäufer zurück ins Dashboard — von dort lässt sich das
 * Onboarding über den Knopf jederzeit neu anstoßen.
 */
export async function GET(anfrage: Request) {
  return NextResponse.redirect(new URL("/dashboard?stripe=abgelaufen", anfrage.url));
}
