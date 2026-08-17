import type { Datenschicht } from "./typen";
import { LokaleDatenschicht } from "./lokal";
import { SupabaseDatenschicht } from "./supabase";

/**
 * Umschalter zwischen lokalen Testdaten und Supabase.
 *
 * DATENQUELLE=lokal    → JSON-Dateien, kein Konto nötig (Standard in Phase 1)
 * DATENQUELLE=supabase → echtes Supabase-Projekt mit Row Level Security
 *
 * Der Wechsel ist eine Zeile in .env.local, kein Umbau: beide Implementierungen
 * erfüllen dasselbe Interface aus ./typen.
 */

export function db(): Datenschicht {
  // Bewusst kein Zwischenspeicher: Die Supabase-Variante liest bei jedem
  // Aufruf die Sitzung des gerade anfragenden Nutzers. Ein einmal erzeugtes
  // und wiederverwendetes Objekt würde die Sitzung des ersten Besuchers an
  // alle weiteren ausliefern.
  const quelle = process.env.DATENQUELLE ?? "lokal";
  return quelle === "supabase"
    ? new SupabaseDatenschicht()
    : new LokaleDatenschicht();
}

export * from "./typen";
