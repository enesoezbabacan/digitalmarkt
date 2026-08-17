"use server";

import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { formatEuro, provisionCent } from "@/lib/geld";
import { stripe } from "@/lib/stripe";
import { verkaeuferZahlungskonto } from "./verkaeufer-bereit";

export type KaufZustand = { fehler?: string };

function seitenAdresse(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/+$/,
    "",
  );
}

/**
 * Startet den Kauf eines digitalen Produkts.
 *
 * Kernpunkte:
 *
 * - Preis und Provision werden AUSSCHLIESSLICH serverseitig aus der Datenbank
 *   gelesen. Aus dem Formular kommt nur die Produkt-ID. Käme der Preis aus dem
 *   Browser, könnte jeder Besucher ihn auf 1 Cent setzen.
 *
 * - Der Widerrufsverzicht nach § 356 Abs. 5 BGB muss VOR dem Kauf ausdrücklich
 *   erklärt werden, sonst erlischt das Widerrufsrecht nicht und der Käufer kann
 *   14 Tage lang die Erstattung verlangen, obwohl er die Datei hat.
 *
 * - Direct Charge auf das Konto des Verkäufers mit application_fee_amount:
 *   Stripe teilt die Zahlung sofort auf, der Verkäufererlös berührt das Konto
 *   des Marktplatzbetreibers nie. Ohne diese Trennung würde der Betreiber
 *   finanzaufsichtsrechtlich zum Zahlungsdienstleister.
 */
export async function kaufStarten(
  _bisher: KaufZustand,
  formular: FormData,
): Promise<KaufZustand> {
  const produktId = (formular.get("produkt_id") ?? "").toString();
  const widerrufVerzicht = formular.get("widerruf_verzicht") === "on";
  const email = (formular.get("kaeufer_email") ?? "").toString().trim();

  if (!widerrufVerzicht) {
    return {
      fehler:
        "Bitte bestätige, dass die Auslieferung sofort startet und du damit dein Widerrufsrecht verlierst.",
    };
  }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return {
      fehler:
        "Bitte gib eine gültige E-Mail-Adresse an — an sie geht der Download-Link.",
    };
  }

  const produkt = await db().produktOeffentlich(produktId);
  if (!produkt) {
    return { fehler: "Dieses Produkt ist nicht mehr verfügbar." };
  }

  // NICHT db().verkaeufer() verwenden: Der Käufer ist nicht angemeldet und
  // sieht per Row Level Security keine fremde Verkäuferzeile — die Abfrage
  // käme leer zurück und JEDER Kauf würde scheitern, obwohl alles in Ordnung
  // ist. Genau dieser Fehler war hier drin. Siehe verkaeufer-bereit.ts.
  const konto = await verkaeuferZahlungskonto(produkt.seller_id);
  if (!konto?.bereit) {
    return {
      fehler:
        "Dieser Verkäufer kann derzeit keine Zahlungen empfangen. Bitte versuche es später erneut.",
    };
  }

  const provision = provisionCent(produkt.preis_cent);
  const basis = seitenAdresse();

  let checkoutUrl: string;

  try {
    const sitzung = await stripe().checkout.sessions.create(
      {
        mode: "payment",
        customer_email: email,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "eur",
              unit_amount: produkt.preis_cent,
              product_data: {
                name: produkt.titel,
                description: produkt.beschreibung.slice(0, 500),
              },
            },
          },
        ],
        payment_intent_data: {
          // Das ist die Provision des Marktplatzes. Stripe zieht sie direkt ab.
          application_fee_amount: provision,
        },
        // Rechnungsadresse erheben — einer der zwei nötigen Standortnachweise
        // bei digitalen Leistungen in der EU.
        billing_address_collection: "required",
        success_url: `${basis}/kauf/danke?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${basis}/produkt/${produkt.id}?abgebrochen=1`,
        metadata: {
          produkt_id: produkt.id,
          verkaeufer_id: produkt.seller_id,
          provision_cent: String(provision),
          widerruf_verzicht_at: new Date().toISOString(),
        },
      },
      // Die Zahlung läuft auf dem Konto des Verkäufers, nicht auf unserem.
      { stripeAccount: konto.stripeKontoId },
    );

    if (!sitzung.url) {
      return { fehler: "Stripe hat keine Bezahlseite geliefert. Bitte erneut versuchen." };
    }

    checkoutUrl = sitzung.url;
  } catch (fehler) {
    const text = fehler instanceof Error ? fehler.message : "Unbekannter Fehler";
    return { fehler: `Die Zahlung konnte nicht gestartet werden: ${text}` };
  }

  redirect(checkoutUrl);
}

/** Nur zur Anzeige im Formular — die verbindliche Rechnung macht Stripe. */
export async function preisHinweis(preisCent: number): Promise<string> {
  return formatEuro(preisCent);
}
