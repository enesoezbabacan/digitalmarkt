import { NextResponse } from "next/server";

import { istAdmin } from "@/lib/admin";
import { centFuerCsv, csvErzeugen } from "@/lib/csv";
import { supabaseService } from "@/lib/supabase/service";

/**
 * CSV-Export aller Bestellungen für den Steuerberater.
 *
 * Optional eingrenzbar über ?von=2026-01-01&bis=2026-12-31 — der Steuerberater
 * arbeitet in Zeiträumen, nicht mit "allem, was da ist".
 *
 * Enthält bewusst auch die Verkäuferangaben: Für die Buchung der
 * Provisionserlöse muss nachvollziehbar sein, von wem sie stammen.
 */
export async function GET(anfrage: Request) {
  if (!(await istAdmin())) {
    return new NextResponse("Nicht gefunden", { status: 404 });
  }

  const adresse = new URL(anfrage.url);
  const von = adresse.searchParams.get("von");
  const bis = adresse.searchParams.get("bis");

  let abfrage = supabaseService()
    .from("orders")
    .select(
      "id, created_at, betrag_cent, provision_cent, status, kaeufer_email, " +
        "kaeufer_land, stripe_payment_intent, products!inner(titel), sellers!inner(name, steuernummer)",
    )
    .order("created_at", { ascending: true });

  // Datumsformat prüfen, statt es ungefiltert an die Datenbank zu geben.
  const istDatum = (w: string) => /^\d{4}-\d{2}-\d{2}$/.test(w);
  if (von && istDatum(von)) abfrage = abfrage.gte("created_at", `${von}T00:00:00Z`);
  if (bis && istDatum(bis)) abfrage = abfrage.lte("created_at", `${bis}T23:59:59Z`);

  const { data, error } = await abfrage;

  if (error) {
    return new NextResponse(`Export fehlgeschlagen: ${error.message}`, {
      status: 500,
    });
  }

  // Rechnungsnummern dazuholen, damit die Buchung auf den Beleg verweisen kann.
  const { data: rechnungen } = await supabaseService()
    .from("commission_invoices")
    .select("order_id, nummer");

  const nummerZu = new Map(
    (rechnungen ?? []).map((r) => [r.order_id as string, r.nummer as string]),
  );

  // Die verschachtelte Auswahl mit zwei Joins übersteigt die Typherleitung von
  // supabase-js; deshalb hier einmal die Form benennen, statt an jeder
  // Zugriffsstelle einzeln zu casten.
  type Zeile = {
    id: string;
    created_at: string;
    betrag_cent: number;
    provision_cent: number;
    status: string;
    kaeufer_email: string;
    kaeufer_land: string | null;
    stripe_payment_intent: string | null;
    products: { titel: string };
    sellers: { name: string; steuernummer: string | null };
  };

  const zeilen = ((data ?? []) as unknown as Zeile[]).map((b) => [
    new Date(b.created_at).toLocaleDateString("de-DE"),
    nummerZu.get(b.id) ?? "",
    b.products.titel,
    b.sellers.name,
    b.sellers.steuernummer ?? "",
    b.kaeufer_email,
    b.kaeufer_land ?? "",
    centFuerCsv(b.betrag_cent),
    centFuerCsv(b.provision_cent),
    centFuerCsv(b.betrag_cent - b.provision_cent),
    b.status,
    b.stripe_payment_intent ?? "",
  ]);

  const csv = csvErzeugen(
    [
      "Datum",
      "Rechnungsnummer",
      "Produkt",
      "Verkäufer",
      "Steuernummer Verkäufer",
      "Käufer",
      "Land",
      "Verkaufspreis",
      "Provision",
      "Verkäuferanteil",
      "Status",
      "Zahlungsreferenz",
    ],
    zeilen,
  );

  const heute = new Date().toISOString().slice(0, 10);
  const name = `bestellungen-${von ?? "alle"}-bis-${bis ?? heute}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  });
}
