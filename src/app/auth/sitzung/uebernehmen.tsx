"use client";

import { useEffect, useState } from "react";

import { sicheresZiel } from "@/lib/weiterleitung";

/**
 * Landepunkt für Links aus Supabase-Mails.
 *
 * Supabase hängt die Anmeldung hinter ein `#` an die Adresse. Alles hinter
 * dem `#` bleibt im Browser, deshalb muss dieser Schritt hier laufen und nicht
 * auf dem Server. Die Werte gehen einmal an /api/auth/sitzung, das daraus ein
 * Anmelde-Cookie macht — erst danach kennt der Server den Nutzer.
 */
export function Uebernehmen({ ziel }: { ziel: string }) {
  const [fehler, setFehler] = useState<string | null>(null);

  useEffect(() => {
    const anker = new URLSearchParams(window.location.hash.slice(1));

    // Supabase meldet Fehler ebenfalls im Anker, z. B. abgelaufene Links.
    if (anker.get("error")) {
      setFehler(
        anker.get("error_code") === "otp_expired"
          ? "Dieser Link ist abgelaufen oder wurde schon benutzt. Fordere einen neuen an."
          : (anker.get("error_description") ?? "Der Link hat nicht funktioniert."),
      );
      return;
    }

    const access_token = anker.get("access_token");
    const refresh_token = anker.get("refresh_token");

    if (!access_token || !refresh_token) {
      setFehler("In diesem Link stecken keine Anmeldedaten.");
      return;
    }

    let abgebrochen = false;

    (async () => {
      const antwort = await fetch("/api/auth/sitzung", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token, refresh_token }),
      });

      if (abgebrochen) return;

      if (!antwort.ok) {
        const inhalt = await antwort.json().catch(() => ({}));
        setFehler(inhalt.fehler ?? "Die Anmeldung hat nicht geklappt.");
        return;
      }

      // Anker aus der Adresszeile entfernen, damit die Token nicht im Verlauf
      // stehen bleiben, und dann weiter zum eigentlichen Ziel.
      window.history.replaceState(null, "", window.location.pathname);
      window.location.replace(sicheresZiel(ziel));
    })();

    return () => {
      abgebrochen = true;
    };
  }, [ziel]);

  if (fehler) {
    return (
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-semibold tracking-tight">
          Das hat nicht geklappt
        </h1>
        <p className="mt-2 text-neutral-700">{fehler}</p>
        <a
          href="/anmelden"
          className="mt-6 inline-block rounded-md bg-neutral-900 px-4 py-2 font-medium text-white hover:bg-neutral-700"
        >
          Zur Anmeldung
        </a>
      </div>
    );
  }

  return (
    <p className="mx-auto max-w-md text-neutral-600">Einen Moment, du wirst angemeldet …</p>
  );
}
