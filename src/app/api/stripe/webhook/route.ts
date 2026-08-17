import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { kaufBestaetigungSenden, verkaufsMeldungSenden } from "@/lib/mail";
import { supabaseService } from "@/lib/supabase/service";
import { stripe } from "@/lib/stripe";

/**
 * Stripe-Webhook: verbindliche Quelle für "Zahlung ist eingegangen".
 *
 * Vier Dinge sind hier kritisch:
 *
 * 1. SIGNATURPRÜFUNG. Ohne sie könnte jeder eine gefälschte Anfrage schicken
 *    und sich kostenlos Downloads erzeugen. Die Prüfung braucht den ROHEN
 *    Anfragetext — deshalb request.text(), niemals request.json().
 *
 * 2. IDEMPOTENZ. Stripe stellt Webhooks mehrfach zu (bei Zeitüberschreitung,
 *    Neustarts, Netzproblemen). Dieselbe Zahlung darf trotzdem nur EINE
 *    Bestellung erzeugen. Abgesichert über die UNIQUE-Spalte
 *    stripe_payment_intent in der Datenbank — Verlass auf "wir haben schon
 *    geprüft, ob es die Bestellung gibt" wäre eine Race Condition.
 *
 * 3. IMMER 200 ZURÜCKGEBEN, wenn wir das Ereignis verstanden haben. Ein Fehler
 *    lässt Stripe endlos erneut zustellen.
 *
 * 4. SERVICE-ROLE-ZUGRIFF. Hier ist kein Nutzer angemeldet, RLS würde jeden
 *    Schreibzugriff blockieren. Bestellungen entstehen ausschließlich hier.
 */

/** Gültigkeitsdauer des Download-Links. */
const TOKEN_STUNDEN = 72;

/** Wie oft ein Download-Link maximal verwendet werden darf. */
export const MAX_DOWNLOADS = 5;

export async function POST(anfrage: Request) {
  const signatur = anfrage.headers.get("stripe-signature");
  const geheimnis = process.env.STRIPE_WEBHOOK_SECRET;

  if (!geheimnis) {
    console.error("STRIPE_WEBHOOK_SECRET fehlt — Webhook kann nicht prüfen.");
    return NextResponse.json({ fehler: "nicht konfiguriert" }, { status: 500 });
  }

  if (!signatur) {
    return NextResponse.json({ fehler: "Signatur fehlt" }, { status: 400 });
  }

  // Roher Text, nicht geparst — die Signatur gilt für exakt diese Bytes.
  const roh = await anfrage.text();

  let ereignis: Stripe.Event;
  try {
    ereignis = stripe().webhooks.constructEvent(roh, signatur, geheimnis);
  } catch (fehler) {
    const text = fehler instanceof Error ? fehler.message : "unbekannt";
    console.error("Webhook-Signatur ungültig:", text);
    return NextResponse.json({ fehler: "Signatur ungültig" }, { status: 400 });
  }

  if (ereignis.type !== "checkout.session.completed") {
    // Andere Ereignisse quittieren wir, damit Stripe nicht erneut zustellt.
    return NextResponse.json({ empfangen: true });
  }

  const sitzung = ereignis.data.object as Stripe.Checkout.Session;

  // Nur bezahlte Sitzungen erzeugen eine Bestellung.
  if (sitzung.payment_status !== "paid") {
    return NextResponse.json({ empfangen: true, hinweis: "nicht bezahlt" });
  }

  try {
    await bestellungAnlegen(sitzung);
  } catch (fehler) {
    const text = fehler instanceof Error ? fehler.message : "unbekannt";
    console.error("Bestellung konnte nicht angelegt werden:", text);
    // 500 -> Stripe versucht es erneut. Das ist hier gewollt: lieber ein
    // erneuter Versuch als eine bezahlte Bestellung, die nie ankommt.
    return NextResponse.json({ fehler: "intern" }, { status: 500 });
  }

  return NextResponse.json({ empfangen: true });
}

async function bestellungAnlegen(sitzung: Stripe.Checkout.Session) {
  const daten = sitzung.metadata ?? {};
  const produktId = daten.produkt_id;
  const verkaeuferId = daten.verkaeufer_id;

  if (!produktId || !verkaeuferId) {
    throw new Error("Pflichtangaben fehlen in den Stripe-Metadaten.");
  }

  const zahlungId =
    typeof sitzung.payment_intent === "string"
      ? sitzung.payment_intent
      : (sitzung.payment_intent?.id ?? sitzung.id);

  const betragCent = sitzung.amount_total ?? 0;
  const provisionCentWert = Number(daten.provision_cent ?? 0);

  // Standortnachweis: Rechnungsland aus der Zahlung, IP-Land aus Stripes
  // eigener Erkennung. Zwei unabhängige Belege, wie bei digitalen Leistungen
  // in der EU gefordert.
  const rechnungsland =
    sitzung.customer_details?.address?.country ?? null;

  const nachweis = {
    rechnungsland,
    quelle_rechnungsland: "stripe_checkout_billing_address",
    erhoben_am: new Date().toISOString(),
    stripe_session: sitzung.id,
  };

  const jetzt = Date.now();
  const token = randomBytes(32).toString("base64url");

  const { error } = await supabaseService().from("orders").insert({
    product_id: produktId,
    seller_id: verkaeuferId,
    kaeufer_email: sitzung.customer_details?.email ?? sitzung.customer_email ?? "",
    betrag_cent: betragCent,
    provision_cent: provisionCentWert,
    stripe_payment_intent: zahlungId,
    kaeufer_land: rechnungsland,
    kaeufer_land_nachweis: nachweis,
    download_token: token,
    token_ablauf: new Date(jetzt + TOKEN_STUNDEN * 3600 * 1000).toISOString(),
    download_zaehler: 0,
    widerruf_verzicht_at: daten.widerruf_verzicht_at ?? null,
    status: "bezahlt",
  });

  if (error) {
    // 23505 = unique_violation auf stripe_payment_intent.
    // Genau das ist der Idempotenz-Schutz: Stripe hat dasselbe Ereignis
    // erneut zugestellt, die Bestellung existiert bereits. Kein Fehler —
    // und ausdrücklich KEIN erneuter Mailversand, sonst bekommt der Käufer
    // bei jeder Zustellung eine weitere Mail.
    if (error.code === "23505") return;
    throw new Error(error.message);
  }

  // Ab hier ist die Bestellung verbindlich gespeichert. Der Mailversand darf
  // sie nicht mehr gefährden — mailsVersenden fängt eigene Fehler ab.
  await mailsVersenden({
    produktId,
    verkaeuferId,
    kaeuferEmail: sitzung.customer_details?.email ?? sitzung.customer_email ?? "",
    betragCent,
    provisionCentWert,
    token,
    tokenAblauf: new Date(jetzt + TOKEN_STUNDEN * 3600 * 1000).toISOString(),
  });
}

/**
 * Verschickt Kaufbestätigung und Verkaufsmeldung.
 *
 * Bewusst nach dem Speichern und mit vollständiger Fehlerbehandlung: Ein
 * Ausfall von Resend darf weder den Kauf rückgängig machen noch Stripe zu
 * Wiederholungen veranlassen. Der Käufer kommt notfalls auch ohne Mail an
 * seinen Download, weil der Token in der Bestellung steht.
 */
async function mailsVersenden(daten: {
  produktId: string;
  verkaeuferId: string;
  kaeuferEmail: string;
  betragCent: number;
  provisionCentWert: number;
  token: string;
  tokenAblauf: string;
}) {
  try {
    const sb = supabaseService();

    const [{ data: produkt }, { data: verkaeufer }] = await Promise.all([
      sb.from("products").select("titel").eq("id", daten.produktId).maybeSingle(),
      sb
        .from("sellers")
        .select("name, email")
        .eq("id", daten.verkaeuferId)
        .maybeSingle(),
    ]);

    const titel = produkt?.titel ?? "Dein Produkt";

    await Promise.all([
      kaufBestaetigungSenden({
        kaeuferEmail: daten.kaeuferEmail,
        produktTitel: titel,
        betragCent: daten.betragCent,
        downloadToken: daten.token,
        tokenAblauf: daten.tokenAblauf,
        verkaeuferName: verkaeufer?.name ?? "dem Verkäufer",
        maxDownloads: MAX_DOWNLOADS,
      }),
      verkaufsMeldungSenden({
        verkaeuferEmail: verkaeufer?.email ?? "",
        produktTitel: titel,
        betragCent: daten.betragCent,
        provisionCent: daten.provisionCentWert,
      }),
    ]);
  } catch (fehler) {
    console.error("Mailversand fehlgeschlagen (Kauf bleibt gültig):", fehler);
  }
}
