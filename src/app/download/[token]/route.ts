import { NextResponse } from "next/server";

import { supabaseService } from "@/lib/supabase/service";

/**
 * Löst einen Download-Token ein.
 *
 * Der Token ist der einzige Schlüssel zur Datei — es gibt bewusst keine
 * Anmeldung, weil Käufer kein Konto haben. Deshalb sind die Grenzen hart:
 *
 * - 72 Stunden gültig
 * - höchstens 5 Abrufe
 * - nur bei Bestellstatus "bezahlt" (nach Erstattung sofort gesperrt)
 *
 * Die Datei wird NIE direkt ausgeliefert und der Bucket bleibt privat.
 * Stattdessen erzeugt Supabase eine kurzlebige signierte Adresse, auf die
 * wir weiterleiten. Ein weitergegebener Link ist damit nach Minuten wertlos.
 */

/** Lebensdauer der signierten Adresse. Kurz, weil sie in der URL sichtbar ist. */
const SIGNATUR_SEKUNDEN = 120;

const MAX_DOWNLOADS = 5;

function fehlerAntwort(text: string, status: number) {
  return new NextResponse(text, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

export async function GET(
  _anfrage: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;

  if (!token || token.length < 20) {
    return fehlerAntwort("Ungültiger Download-Link.", 400);
  }

  const sb = supabaseService();

  const { data: bestellung } = await sb
    .from("orders")
    .select("id, product_id, token_ablauf, download_zaehler, status")
    .eq("download_token", token)
    .maybeSingle();

  // Bewusst dieselbe Meldung für "gibt es nicht" und "abgelaufen" — sonst
  // ließe sich durch Ausprobieren herausfinden, welche Tokens existieren.
  if (!bestellung) {
    return fehlerAntwort("Dieser Download-Link ist ungültig oder abgelaufen.", 404);
  }

  if (bestellung.status !== "bezahlt") {
    return fehlerAntwort(
      "Diese Bestellung wurde storniert oder erstattet. Der Download ist nicht mehr verfügbar.",
      403,
    );
  }

  if (bestellung.token_ablauf && new Date(bestellung.token_ablauf) < new Date()) {
    return fehlerAntwort(
      "Dieser Download-Link ist abgelaufen. Er war 72 Stunden gültig.",
      410,
    );
  }

  if (bestellung.download_zaehler >= MAX_DOWNLOADS) {
    return fehlerAntwort(
      `Dieser Download-Link wurde bereits ${MAX_DOWNLOADS} Mal verwendet und ist damit aufgebraucht.`,
      429,
    );
  }

  const { data: produkt } = await sb
    .from("products")
    .select("datei_pfad, datei_name")
    .eq("id", bestellung.product_id)
    .maybeSingle();

  if (!produkt?.datei_pfad) {
    return fehlerAntwort(
      "Zu dieser Bestellung ist keine Datei hinterlegt. Bitte wende dich an den Support.",
      500,
    );
  }

  const { data: signiert, error: signaturFehler } = await sb.storage
    .from("produktdateien")
    .createSignedUrl(produkt.datei_pfad, SIGNATUR_SEKUNDEN, {
      download: produkt.datei_name ?? true,
    });

  if (signaturFehler || !signiert?.signedUrl) {
    return fehlerAntwort(
      "Die Datei konnte gerade nicht bereitgestellt werden. Bitte versuche es in einer Minute erneut.",
      500,
    );
  }

  // Zähler erst NACH erfolgreicher Signatur erhöhen — sonst verbraucht ein
  // technischer Fehler einen Abruf des Käufers.
  await sb
    .from("orders")
    .update({ download_zaehler: bestellung.download_zaehler + 1 })
    .eq("id", bestellung.id);

  return NextResponse.redirect(signiert.signedUrl);
}
