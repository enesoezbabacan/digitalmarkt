"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  meldungBearbeiten,
  produktStatusSetzen,
  verkaeuferStatusSetzen,
} from "@/lib/db/admin";

/**
 * Aktionen des Betreibers.
 *
 * Die Zugangsprüfung passiert nicht hier, sondern in jeder Funktion aus
 * lib/db/admin.ts. Das ist Absicht: eine vergessene Prüfung in einer neuen
 * Aktion soll nichts öffnen.
 *
 * Alle Eingaben werden gegen feste Listen geprüft. Ein Formularfeld kann
 * jeden beliebigen Wert enthalten — auch einen, den unsere Oberfläche gar
 * nicht anbietet.
 */

export type AdminZustand = { fehler?: string; erfolg?: string };

const UUID = z.string().uuid("Ungültige Kennung.");

const produktEingabe = z.object({
  produkt_id: UUID,
  status: z.enum(["draft", "review", "live", "removed"]),
});

const verkaeuferEingabe = z.object({
  verkaeufer_id: UUID,
  status: z.enum(["pending", "active", "suspended"]),
});

const meldungEingabe = z.object({
  meldung_id: UUID,
  status: z.enum(["offen", "geprueft", "erledigt", "abgelehnt"]),
  notizen: z.string().trim().max(2000).optional(),
});

/** Wandelt einen geworfenen Fehler in eine lesbare Meldung für die Seite. */
function alsMeldung(fehler: unknown): AdminZustand {
  return {
    fehler: fehler instanceof Error ? fehler.message : "Unbekannter Fehler.",
  };
}

export async function produktStatusAendern(
  _bisher: AdminZustand,
  formular: FormData,
): Promise<AdminZustand> {
  const geprueft = produktEingabe.safeParse({
    produkt_id: (formular.get("produkt_id") ?? "").toString(),
    status: (formular.get("status") ?? "").toString(),
  });

  if (!geprueft.success) return { fehler: geprueft.error.issues[0].message };

  try {
    await produktStatusSetzen(geprueft.data.produkt_id, geprueft.data.status);
  } catch (fehler) {
    return alsMeldung(fehler);
  }

  revalidatePath("/admin");
  revalidatePath("/"); // Katalog zeigt sonst den alten Stand
  return { erfolg: "Produktstatus geändert." };
}

export async function verkaeuferStatusAendern(
  _bisher: AdminZustand,
  formular: FormData,
): Promise<AdminZustand> {
  const geprueft = verkaeuferEingabe.safeParse({
    verkaeufer_id: (formular.get("verkaeufer_id") ?? "").toString(),
    status: (formular.get("status") ?? "").toString(),
  });

  if (!geprueft.success) return { fehler: geprueft.error.issues[0].message };

  try {
    await verkaeuferStatusSetzen(
      geprueft.data.verkaeufer_id,
      geprueft.data.status,
    );
  } catch (fehler) {
    return alsMeldung(fehler);
  }

  revalidatePath("/admin");
  revalidatePath("/");
  return {
    erfolg:
      geprueft.data.status === "suspended"
        ? "Verkäufer gesperrt. Seine Produkte sind aus dem Katalog genommen."
        : "Verkäuferstatus geändert.",
  };
}

export async function meldungAendern(
  _bisher: AdminZustand,
  formular: FormData,
): Promise<AdminZustand> {
  const notizen = (formular.get("notizen") ?? "").toString();

  const geprueft = meldungEingabe.safeParse({
    meldung_id: (formular.get("meldung_id") ?? "").toString(),
    status: (formular.get("status") ?? "").toString(),
    notizen,
  });

  if (!geprueft.success) return { fehler: geprueft.error.issues[0].message };

  try {
    await meldungBearbeiten(
      geprueft.data.meldung_id,
      geprueft.data.status,
      geprueft.data.notizen?.trim() ? geprueft.data.notizen.trim() : null,
    );
  } catch (fehler) {
    return alsMeldung(fehler);
  }

  revalidatePath("/admin");
  return { erfolg: "Meldung gespeichert." };
}
