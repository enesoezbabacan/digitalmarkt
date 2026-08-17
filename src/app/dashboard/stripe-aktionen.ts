"use server";

import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { supabaseService } from "@/lib/supabase/service";
import { angemeldeteVerkaeuferId } from "@/lib/sitzung";
import { stripe } from "@/lib/stripe";

/** Adresse, unter der die Seite läuft — Ziel für Rückkehr-Links von Stripe. */
function seitenAdresse(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/+$/,
    "",
  );
}

/**
 * Startet oder setzt das Stripe-Connect-Onboarding eines Verkäufers fort.
 *
 * Stripe Connect Express übernimmt die komplette Identitätsprüfung (KYC) und
 * Bankverbindung — wir speichern nur die Kontonummer, die Stripe vergibt.
 * Nie Bankdaten selbst entgegennehmen oder speichern.
 *
 * Ablauf:
 * 1. Existiert noch kein Stripe-Konto für den Verkäufer, wird eines angelegt
 *    (Type "Express", Land Deutschland, Direct Charges — passend zu unserem
 *    Provisionsmodell mit application_fee_amount).
 * 2. Die stripe_account_id wird gespeichert. Das geht nur über den
 *    service_role-Client, weil die normale Nutzerrolle dieses Feld laut RLS
 *    nicht selbst schreiben darf (siehe Migration 0001) — sonst könnte ein
 *    Verkäufer sich fremde Auszahlungen zuschieben.
 * 3. Ein einmaliger Onboarding-Link wird erzeugt und der Verkäufer dorthin
 *    weitergeleitet. Der Link läuft nach kurzer Zeit ab und darf nicht
 *    zwischengespeichert werden.
 */
export async function stripeOnboardingStarten(): Promise<void> {
  const verkaeuferId = await angemeldeteVerkaeuferId();
  if (!verkaeuferId) redirect("/anmelden");

  const verkaeufer = await db().verkaeufer(verkaeuferId);
  if (!verkaeufer) redirect("/abmelden");

  let stripeKontoId = verkaeufer.stripe_account_id;

  if (!stripeKontoId) {
    const konto = await stripe().accounts.create({
      type: "express",
      country: "DE",
      email: verkaeufer.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "individual",
      metadata: { verkaeufer_id: verkaeuferId },
    });

    stripeKontoId = konto.id;

    const { error } = await supabaseService()
      .from("sellers")
      .update({ stripe_account_id: stripeKontoId })
      .eq("id", verkaeuferId);

    if (error) {
      throw new Error(
        `Stripe-Konto konnte nicht gespeichert werden: ${error.message}`,
      );
    }
  }

  const basis = seitenAdresse();
  const link = await stripe().accountLinks.create({
    account: stripeKontoId,
    // Wenn der Link abläuft oder der Verkäufer abbricht, kommt er hierher
    // zurück und kann neu starten.
    refresh_url: `${basis}/dashboard/stripe/refresh`,
    return_url: `${basis}/dashboard/stripe/return`,
    type: "account_onboarding",
  });

  redirect(link.url);
}
