"use server";

import { redirect } from "next/navigation";

import { supabaseServer } from "@/lib/supabase/server";

/**
 * Neues Passwort setzen.
 *
 * Erreichbar nur mit laufender Sitzung — entweder nach einem Klick auf den
 * Wiederherstellungslink oder für jemanden, der ohnehin angemeldet ist. Das
 * alte Passwort wird bewusst nicht abgefragt: wer den Link anfordert, hat es
 * ja gerade nicht.
 */

export type PasswortZustand = { fehler?: string };

const MIN_LAENGE = 10;

export async function passwortSetzen(
  _bisher: PasswortZustand,
  formular: FormData,
): Promise<PasswortZustand> {
  const passwort = (formular.get("passwort") ?? "").toString();
  const wiederholung = (formular.get("passwort_wiederholung") ?? "").toString();

  if (passwort.length < MIN_LAENGE) {
    return { fehler: `Das Passwort muss mindestens ${MIN_LAENGE} Zeichen lang sein.` };
  }
  if (passwort !== wiederholung) {
    return { fehler: "Die beiden Passwörter stimmen nicht überein." };
  }

  const sb = await supabaseServer();

  // Ohne gültige Sitzung darf hier nichts passieren — sonst könnte jeder das
  // Passwort eines fremden Kontos überschreiben.
  const { data } = await sb.auth.getUser();
  if (!data.user) {
    return {
      fehler:
        "Der Link ist abgelaufen oder wurde schon benutzt. Fordere einen neuen an.",
    };
  }

  const { error } = await sb.auth.updateUser({ password: passwort });
  if (error) {
    return { fehler: `Das Passwort konnte nicht gespeichert werden: ${error.message}` };
  }

  redirect("/dashboard");
}
