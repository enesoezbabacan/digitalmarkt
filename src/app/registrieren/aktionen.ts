"use server";

import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { neuerVerkaeuferAnBetreiberSenden } from "@/lib/mail";
import { angemeldeteVerkaeuferId, sitzungSetzen } from "@/lib/sitzung";
import { verkaeuferSchema } from "@/lib/validation/verkaeufer";
import { pruefeUstId } from "@/lib/vies";

export type FormularZustand = {
  fehler?: Record<string, string>;
  allgemeinerFehler?: string;
  werte?: Record<string, string>;
};

const MIN_PASSWORTLAENGE = 10;

/**
 * Registrierung eines Verkäufers.
 *
 * Diese Prüfung ist die einzige, auf die wir uns verlassen. Alles, was im
 * Browser passiert, ist nur Bequemlichkeit — ein Angreifer schickt das
 * Formular ohne Browser ab.
 */
export async function registrieren(
  _bisher: FormularZustand,
  formular: FormData,
): Promise<FormularZustand> {
  const feld = (name: string) => (formular.get(name) ?? "").toString();

  // Eingaben zurückgeben, damit der Nutzer bei einem Fehler nicht alles
  // neu tippen muss. Passwörter gehören ausdrücklich nicht dazu.
  const werte: Record<string, string> = Object.fromEntries(
    [
      "name",
      "email",
      "telefon",
      "strasse",
      "plz",
      "ort",
      "land",
      "steuernummer",
      "ust_id",
    ].map((n) => [n, feld(n)]),
  );

  const passwort = feld("passwort");
  const passwortWiederholung = feld("passwort_wiederholung");

  const geprueft = verkaeuferSchema.safeParse({
    ...werte,
    rechte_bestaetigt: formular.get("rechte_bestaetigt") === "on",
    bedingungen_akzeptiert: formular.get("bedingungen_akzeptiert") === "on",
  });

  const fehler: Record<string, string> = {};

  if (!geprueft.success) {
    for (const problem of geprueft.error.issues) {
      const pfad = problem.path[0]?.toString() ?? "allgemein";
      fehler[pfad] ??= problem.message;
    }
  }

  if (passwort.length < MIN_PASSWORTLAENGE) {
    fehler.passwort = `Das Passwort muss mindestens ${MIN_PASSWORTLAENGE} Zeichen lang sein.`;
  } else if (passwort !== passwortWiederholung) {
    fehler.passwort_wiederholung = "Die beiden Passwörter stimmen nicht überein.";
  }

  if (Object.keys(fehler).length > 0) {
    return { fehler, werte };
  }

  const daten = geprueft.data!;
  const ustId = daten.ust_id?.trim() ? daten.ust_id.trim() : null;

  const angelegt = await db().verkaeuferAnlegen(
    {
      name: daten.name,
      email: daten.email,
      telefon: daten.telefon,
      strasse: daten.strasse,
      plz: daten.plz,
      ort: daten.ort,
      land: daten.land,
      steuernummer: daten.steuernummer,
      ust_id: ustId,
      // Vorbelegung: Kleinunternehmer. Änderbar, sobald der
      // Verkäufer im Dashboard seinen Steuerstatus pflegt.
      kleinunternehmer: true,
    },
    passwort,
  );

  if ("fehler" in angelegt) {
    return { allgemeinerFehler: angelegt.fehler, werte };
  }

  // Bewusst ohne await auf den Erfolg der Mail zu warten: Ein langsamer oder
  // fehlschlagender Mailversand darf die Registrierung nicht verzögern oder
  // scheitern lassen — die Funktion fängt ihre Fehler selbst ab.
  void neuerVerkaeuferAnBetreiberSenden({
    name: daten.name,
    email: daten.email,
    ort: daten.ort,
  });

  await sitzungSetzen(angelegt.id);

  // Mit Supabase Auth ist das Konto erst nach dem Klick auf den Link in der
  // Bestätigungsmail nutzbar. Vorher gibt es keine Sitzung — dann führt der
  // Weg ins Dashboard ins Leere, und wir sagen es dem Nutzer stattdessen.
  const angemeldet = await angemeldeteVerkaeuferId();
  if (!angemeldet) redirect("/registrieren/bestaetigen");

  // Art. 30 Abs. 2 DSA: zumutbare Anstrengung, die Angaben zu überprüfen.
  // Ein Ausfall des EU-Dienstes darf die Registrierung nicht scheitern lassen —
  // das Ergebnis wird protokolliert und kann später erneut geprüft werden.
  if (ustId) {
    const ergebnis = await pruefeUstId(ustId);
    await db().ustPruefungSpeichern(
      angelegt.id,
      ergebnis.status,
      ergebnis.geprueftAm,
    );
  }

  redirect("/dashboard");
}
