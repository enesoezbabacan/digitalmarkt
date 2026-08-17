import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

import { supabaseServer } from "@/lib/supabase/server";

/**
 * Anmelde-Sitzung des Verkäufers.
 *
 * Zwei Betriebsarten, passend zur gewählten Datenquelle:
 *
 * - `supabase`: Supabase Auth verwaltet die Sitzung. Das ist der Normalfall.
 *   Entscheidend ist, dass die Verkäufer-ID aus einem von Supabase geprüften
 *   Token stammt — nur so greifen die Sicherheitsregeln in der Datenbank.
 *
 * - `lokal`: signiertes Cookie ohne Datenbank, damit sich ohne Konto
 *   entwickeln lässt. Signiert heißt: der Inhalt ist lesbar, aber nicht
 *   fälschbar — ohne das Geheimnis kann niemand ein Cookie für eine fremde
 *   Verkäufer-ID bauen.
 */

const COOKIE_NAME = "dm_sitzung";
const LAUFZEIT_SEKUNDEN = 60 * 60 * 24 * 7; // 7 Tage

function nutztSupabase(): boolean {
  return (process.env.DATENQUELLE ?? "lokal") === "supabase";
}

function geheimnis(): string {
  const wert = process.env.SITZUNGS_GEHEIMNIS;
  if (!wert || wert.length < 32) {
    throw new Error(
      "SITZUNGS_GEHEIMNIS fehlt oder ist zu kurz (mindestens 32 Zeichen). " +
        "Siehe .env.example.",
    );
  }
  return wert;
}

function signieren(inhalt: string): string {
  return createHmac("sha256", geheimnis()).update(inhalt).digest("base64url");
}

function signaturPasst(inhalt: string, signatur: string): boolean {
  const erwartet = Buffer.from(signieren(inhalt));
  const erhalten = Buffer.from(signatur);
  if (erwartet.length !== erhalten.length) return false;
  return timingSafeEqual(erwartet, erhalten);
}

/**
 * Startet eine Sitzung.
 *
 * Mit Supabase geschieht das bereits beim Anmelden selbst — der Client setzt
 * die Cookies. Hier ist dann nichts zu tun.
 */
export async function sitzungSetzen(verkaeuferId: string): Promise<void> {
  if (nutztSupabase()) return;

  const ablauf = Date.now() + LAUFZEIT_SEKUNDEN * 1000;
  const inhalt = `${verkaeuferId}.${ablauf}`;
  const speicher = await cookies();

  speicher.set(COOKIE_NAME, `${inhalt}.${signieren(inhalt)}`, {
    httpOnly: true, // kein Zugriff aus JavaScript im Browser
    sameSite: "lax", // schützt gegen fremde Formulare (CSRF)
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: LAUFZEIT_SEKUNDEN,
  });
}

export async function sitzungBeenden(): Promise<void> {
  if (nutztSupabase()) {
    const sb = await supabaseServer();
    await sb.auth.signOut();
    return;
  }

  const speicher = await cookies();
  speicher.delete(COOKIE_NAME);
}

/** Gibt die Verkäufer-ID der laufenden Sitzung zurück, oder null. */
export async function angemeldeteVerkaeuferId(): Promise<string | null> {
  if (nutztSupabase()) {
    const sb = await supabaseServer();
    // getUser() prüft das Token gegen Supabase. getSession() würde nur dem
    // Cookie glauben und wäre damit fälschbar.
    const { data } = await sb.auth.getUser();
    return data.user?.id ?? null;
  }

  const speicher = await cookies();
  const roh = speicher.get(COOKIE_NAME)?.value;
  if (!roh) return null;

  const teile = roh.split(".");
  if (teile.length !== 3) return null;

  const [id, ablauf, signatur] = teile;
  if (!signaturPasst(`${id}.${ablauf}`, signatur)) return null;
  if (!Number(ablauf) || Number(ablauf) < Date.now()) return null;

  return id;
}
