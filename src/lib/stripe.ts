import Stripe from "stripe";

/**
 * Zentraler Stripe-Client für den Server.
 *
 * Der Secret Key darf ausschließlich hier und in serverseitigem Code
 * (Server Actions, Route Handler) verwendet werden — nie in einer
 * NEXT_PUBLIC_-Variable, sonst könnte jeder Besucher damit in deinem Namen
 * Zahlungen auslösen oder Kontodaten abfragen.
 */
let client: Stripe | null = null;

export function stripe(): Stripe {
  if (client) return client;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY fehlt in .env.local. Siehe .env.example.",
    );
  }

  client = new Stripe(key);
  return client;
}
