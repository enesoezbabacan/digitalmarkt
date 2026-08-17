import { adminPflicht } from "@/lib/admin";
import { supabaseService } from "@/lib/supabase/service";
import type {
  Bestellung,
  Meldung,
  MeldungStatus,
  Produkt,
  ProduktStatus,
  Verkaeufer,
  VerkaeuferStatus,
} from "./typen";

/**
 * Datenzugriffe des Betreibers.
 *
 * Läuft über den service_role-Schlüssel und sieht damit die Daten aller
 * Verkäufer — Row Level Security greift hier nicht. Jede Funktion prüft
 * deshalb selbst, ob der Aufrufer Admin ist; die Prüfung in der Seite ist nur
 * die zweite Schicht.
 *
 * Nur für DATENQUELLE=supabase. Für die lokalen Testdaten gibt es weiterhin
 * scripts/freigeben.mjs.
 */

async function client() {
  await adminPflicht();
  if ((process.env.DATENQUELLE ?? "lokal") !== "supabase") {
    throw new Error(
      "Der Admin-Bereich arbeitet nur mit DATENQUELLE=supabase. " +
        "Für die lokalen Testdaten: node scripts/freigeben.mjs",
    );
  }
  return supabaseService();
}

/** Produkt mit dem Namen seines Verkäufers, für die Admin-Listen. */
export type AdminProdukt = Produkt & { verkaeufer_name: string };
export type AdminBestellung = Bestellung & {
  produkt_titel: string;
  verkaeufer_name: string;
};
export type AdminMeldung = Meldung & { produkt_titel: string };

export type AdminZahlen = {
  umsatzCent: number;
  provisionCent: number;
  verkaeufe: number;
  erstattungen: number;
  produkteLive: number;
  produkteWartend: number;
  verkaeuferAktiv: number;
  meldungenOffen: number;
};

function fehler(was: string, meldung: string): never {
  throw new Error(`${was} konnte nicht geladen werden: ${meldung}`);
}

export async function adminProdukte(): Promise<AdminProdukt[]> {
  const sb = await client();
  const { data, error } = await sb
    .from("products")
    .select("*, sellers!inner(name)")
    .order("created_at", { ascending: false });

  if (error) fehler("Die Produktliste", error.message);

  return (data ?? []).map((zeile) => {
    const { sellers, ...produkt } = zeile as Produkt & {
      sellers: { name: string };
    };
    return { ...produkt, verkaeufer_name: sellers.name };
  });
}

export async function adminVerkaeufer(): Promise<Verkaeufer[]> {
  const sb = await client();
  const { data, error } = await sb
    .from("sellers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) fehler("Die Verkäuferliste", error.message);
  return (data ?? []) as Verkaeufer[];
}

export async function adminBestellungen(
  grenze = 200,
): Promise<AdminBestellung[]> {
  const sb = await client();
  const { data, error } = await sb
    .from("orders")
    .select("*, products!inner(titel), sellers!inner(name)")
    .order("created_at", { ascending: false })
    .limit(grenze);

  if (error) fehler("Die Bestellliste", error.message);

  return (data ?? []).map((zeile) => {
    const { products, sellers, ...bestellung } = zeile as Bestellung & {
      products: { titel: string };
      sellers: { name: string };
    };
    return {
      ...bestellung,
      produkt_titel: products.titel,
      verkaeufer_name: sellers.name,
    };
  });
}

export async function adminMeldungen(): Promise<AdminMeldung[]> {
  const sb = await client();
  const { data, error } = await sb
    .from("abuse_reports")
    .select("*, products!inner(titel)")
    // Offene Meldungen zuerst — Art. 16 DSA verlangt zeitnahe Bearbeitung.
    .order("status", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) fehler("Die Meldungen", error.message);

  return (data ?? []).map((zeile) => {
    const { products, ...meldung } = zeile as Meldung & {
      products: { titel: string };
    };
    return { ...meldung, produkt_titel: products.titel };
  });
}

/** Kennzahlen für die Übersicht. */
export function adminZahlen(
  produkte: AdminProdukt[],
  verkaeufer: Verkaeufer[],
  bestellungen: AdminBestellung[],
  meldungen: AdminMeldung[],
): AdminZahlen {
  // Erstattete und stornierte Käufe zählen nicht zum Umsatz — sonst zeigt
  // die Übersicht Geld an, das längst zurückgeflossen ist.
  const bezahlt = bestellungen.filter((b) => b.status === "bezahlt");

  return {
    umsatzCent: bezahlt.reduce((s, b) => s + b.betrag_cent, 0),
    provisionCent: bezahlt.reduce((s, b) => s + b.provision_cent, 0),
    verkaeufe: bezahlt.length,
    erstattungen: bestellungen.filter((b) => b.status === "erstattet").length,
    produkteLive: produkte.filter((p) => p.status === "live").length,
    produkteWartend: produkte.filter((p) => p.status === "review").length,
    verkaeuferAktiv: verkaeufer.filter((v) => v.status !== "suspended").length,
    meldungenOffen: meldungen.filter((m) => m.status === "offen").length,
  };
}

export async function produktStatusSetzen(
  produktId: string,
  status: ProduktStatus,
): Promise<void> {
  const sb = await client();

  // Die Datenbank lehnt 'live' ohne hinterlegte Datei ab
  // (constraint live_braucht_datei). Vorher prüfen, damit im Admin eine
  // verständliche Meldung steht und nicht der rohe Datenbankfehler.
  if (status === "live") {
    const { data } = await sb
      .from("products")
      .select("datei_pfad")
      .eq("id", produktId)
      .maybeSingle();

    if (!data?.datei_pfad) {
      throw new Error(
        "Dieses Produkt hat keine Datei. Ohne Datei kann es nicht in den " +
          "Katalog — Käufer bekämen nichts geliefert.",
      );
    }
  }

  const { error } = await sb
    .from("products")
    .update({ status })
    .eq("id", produktId);

  if (error) throw new Error(`Status konnte nicht geändert werden: ${error.message}`);
}

export async function verkaeuferStatusSetzen(
  verkaeuferId: string,
  status: VerkaeuferStatus,
): Promise<void> {
  const sb = await client();

  const { error } = await sb
    .from("sellers")
    .update({ status })
    .eq("id", verkaeuferId);

  if (error) throw new Error(`Status konnte nicht geändert werden: ${error.message}`);

  // Ein gesperrter Verkäufer darf keine Produkte mehr im Katalog haben.
  // Nur 'live' wird entfernt — Entwürfe bleiben erhalten, damit bei einer
  // Aufhebung der Sperre nichts verloren ist.
  if (status === "suspended") {
    const { error: fehlerProdukte } = await sb
      .from("products")
      .update({ status: "removed" })
      .eq("seller_id", verkaeuferId)
      .eq("status", "live");

    if (fehlerProdukte) {
      throw new Error(
        "Der Verkäufer ist gesperrt, aber seine Produkte konnten nicht aus " +
          `dem Katalog genommen werden: ${fehlerProdukte.message}`,
      );
    }
  }
}

export async function meldungBearbeiten(
  meldungId: string,
  status: MeldungStatus,
  notizen: string | null,
): Promise<void> {
  const sb = await client();

  const { error } = await sb
    .from("abuse_reports")
    .update({
      status,
      notizen,
      erledigt_at:
        status === "erledigt" || status === "abgelehnt"
          ? new Date().toISOString()
          : null,
    })
    .eq("id", meldungId);

  if (error) throw new Error(`Meldung konnte nicht gespeichert werden: ${error.message}`);
}
