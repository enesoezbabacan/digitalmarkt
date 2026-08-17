import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Danke für deinen Kauf" };

/**
 * Bestätigungsseite nach der Zahlung.
 *
 * Diese Seite darf NICHT als Beleg dafür gelten, dass die Zahlung erfolgreich
 * war — der Käufer landet hier allein dadurch, dass Stripe ihn zurückschickt.
 * Verbindlich ist ausschließlich der Webhook (checkout.session.completed), der
 * die Bestellung anlegt und den Download-Link verschickt. Deshalb steht hier
 * bewusst nichts, was von einer Bestellung ausgeht.
 */
export default function Danke() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-3xl font-semibold tracking-tight">
        Danke für deinen Kauf
      </h1>

      <p className="mt-4 text-neutral-700">
        Deine Zahlung wird verarbeitet. Sobald sie bestätigt ist, bekommst du
        eine E-Mail mit deinem persönlichen Download-Link.
      </p>

      <p className="mt-4 text-neutral-700">
        Das dauert normalerweise nur wenige Sekunden. Schau auch im Spam-Ordner
        nach, falls nichts ankommt.
      </p>

      <p className="mt-6 text-sm text-neutral-500">
        Der Download-Link ist 72 Stunden gültig und kann bis zu fünf Mal
        verwendet werden.
      </p>

      <Link
        href="/"
        className="mt-8 inline-block rounded-md bg-neutral-900 px-4 py-3 font-medium text-white hover:bg-neutral-700"
      >
        Zurück zum Katalog
      </Link>
    </div>
  );
}
