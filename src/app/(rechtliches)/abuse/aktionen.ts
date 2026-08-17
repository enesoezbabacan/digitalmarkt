"use server";

import { db } from "@/lib/db";
import {
  meldungAnBetreiberSenden,
  meldungsBestaetigungSenden,
} from "@/lib/mail";
import { supabaseService } from "@/lib/supabase/service";
import { grundText, meldungSchema } from "@/lib/validation/meldung";

/**
 * Meldeverfahren nach Art. 16 DSA.
 *
 * Jede Person muss melden können — ohne Konto, ohne Anmeldung. Die Meldung
 * wird gespeichert, der Betreiber benachrichtigt und dem Melder der Eingang
 * bestätigt.
 *
 * Bewusst über den service_role-Schlüssel: Der Melder ist nicht angemeldet und
 * soll auch nicht das Produkt lesen können, wenn es inzwischen offline ist.
 * Die Rechteprüfung passiert hier — es wird ausschließlich in abuse_reports
 * geschrieben, nirgends sonst.
 */

export type MeldungsZustand = {
  fehler?: Record<string, string>;
  allgemeinerFehler?: string;
  erfolg?: boolean;
  werte?: Record<string, string>;
};

export async function meldungSenden(
  _bisher: MeldungsZustand,
  formular: FormData,
): Promise<MeldungsZustand> {
  const feld = (name: string) => (formular.get(name) ?? "").toString();

  // Eingaben zurückgeben, damit bei einem Fehler nicht alles neu getippt
  // werden muss. Eine lange Begründung zweimal zu schreiben nimmt Meldern
  // die Lust — und die Meldung ist eine Pflichtfunktion, keine Kür.
  const werte: Record<string, string> = Object.fromEntries(
    ["produkt_id", "melder_email", "melder_name", "kategorie", "begruendung"].map(
      (n) => [n, feld(n)],
    ),
  );

  const geprueft = meldungSchema.safeParse({
    ...werte,
    melder_name: feld("melder_name") || undefined,
    richtigkeit_bestaetigt: formular.get("richtigkeit_bestaetigt") === "on",
  });

  if (!geprueft.success) {
    const fehler: Record<string, string> = {};
    for (const problem of geprueft.error.issues) {
      const pfad = problem.path[0]?.toString() ?? "allgemein";
      fehler[pfad] ??= problem.message;
    }
    return { fehler, werte };
  }

  const daten = geprueft.data;

  // Das Produkt muss es geben. Sonst könnte jemand die Tabelle mit Meldungen
  // zu erfundenen Kennungen füllen.
  const produkt = await db().produktOeffentlich(daten.produkt_id);
  if (!produkt) {
    return {
      fehler: { produkt_id: "Dieses Produkt gibt es nicht (mehr)." },
      werte,
    };
  }

  const sb = supabaseService();
  const { error } = await sb.from("abuse_reports").insert({
    product_id: daten.produkt_id,
    melder_email: daten.melder_email,
    melder_name: daten.melder_name ?? null,
    grund: grundText(daten.kategorie, daten.begruendung),
  });

  if (error) {
    // Hier NICHT stillschweigend weitergehen: Eine Meldung, die niemand
    // gespeichert hat, ist keine Meldung. Der Melder muss erfahren, dass er
    // es erneut versuchen muss.
    console.error("Meldung konnte nicht gespeichert werden:", error);
    return {
      allgemeinerFehler:
        "Deine Meldung konnte nicht gespeichert werden. Bitte versuche es " +
        "noch einmal oder schreib uns an die im Impressum genannte Adresse.",
      werte,
    };
  }

  // Mails erst nach dem erfolgreichen Speichern — und ihr Scheitern darf die
  // Meldung nicht entwerten. Beide Funktionen fangen ihre Fehler selbst ab.
  const mailDaten = {
    melderEmail: daten.melder_email,
    melderName: daten.melder_name ?? null,
    produktTitel: produkt.titel,
    kategorie: daten.kategorie,
    begruendung: daten.begruendung,
  };
  await Promise.all([
    meldungAnBetreiberSenden(mailDaten),
    meldungsBestaetigungSenden(mailDaten),
  ]);

  return { erfolg: true };
}
