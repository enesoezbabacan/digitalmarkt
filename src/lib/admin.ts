import { db } from "@/lib/db";
import { angemeldeteVerkaeuferId } from "@/lib/sitzung";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Zugangskontrolle für den Admin-Bereich.
 *
 * Der Admin-Bereich arbeitet mit dem service_role-Schlüssel und umgeht damit
 * Row Level Security vollständig — er sieht die Daten ALLER Verkäufer. Diese
 * Prüfung ist deshalb die einzige Grenze, die dazwischen steht.
 *
 * Bewusst über eine Umgebungsvariable und nicht über ein Feld in der
 * Datenbank: Ein Datenbankfeld könnte durch einen Fehler in einer Policy oder
 * einem Trigger von außen setzbar werden. Die Liste in .env.local kann nur
 * ändern, wer ohnehin schon Zugriff auf den Server hat.
 */

/** Erlaubte Admin-Adressen aus ADMIN_EMAILS, kleingeschrieben. */
function adminAdressen(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * E-Mail-Adresse des angemeldeten Nutzers.
 *
 * Mit Supabase kommt sie aus dem geprüften Token (getUser), nicht aus einem
 * Cookie oder aus unserer eigenen Tabelle — sonst könnte eine manipulierte
 * sellers-Zeile Admin-Rechte verschaffen.
 */
async function angemeldeteEmail(): Promise<string | null> {
  if ((process.env.DATENQUELLE ?? "lokal") === "supabase") {
    const sb = await supabaseServer();
    const { data } = await sb.auth.getUser();
    return data.user?.email?.toLowerCase() ?? null;
  }

  const id = await angemeldeteVerkaeuferId();
  if (!id) return null;
  const verkaeufer = await db().verkaeufer(id);
  return verkaeufer?.email.toLowerCase() ?? null;
}

export async function istAdmin(): Promise<boolean> {
  const erlaubt = adminAdressen();

  // Ist keine Adresse hinterlegt, ist der Bereich für niemanden offen.
  // Andernfalls wäre der Admin-Bereich nach einem vergessenen Eintrag in
  // .env.local für jeden Angemeldeten erreichbar.
  if (erlaubt.length === 0) return false;

  const email = await angemeldeteEmail();
  return email !== null && erlaubt.includes(email);
}

/**
 * Wirft, wenn der Aufrufer kein Admin ist.
 *
 * Jede Admin-Datenfunktion ruft das selbst auf, zusätzlich zur Prüfung in der
 * Seite. Eine einzige vergessene Prüfung in einer neuen Route soll nicht
 * genügen, um an fremde Daten zu kommen.
 */
export async function adminPflicht(): Promise<void> {
  if (!(await istAdmin())) {
    throw new Error("Kein Zugriff auf den Admin-Bereich.");
  }
}
