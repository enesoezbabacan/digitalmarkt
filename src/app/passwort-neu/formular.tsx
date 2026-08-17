"use client";

import { useActionState } from "react";

import { passwortSetzen } from "./aktionen";

export function PasswortFormular() {
  const [zustand, absenden, laeuft] = useActionState(passwortSetzen, {});

  return (
    <form action={absenden} className="mt-6 space-y-4">
      <div>
        <label htmlFor="passwort" className="block text-sm font-medium">
          Neues Passwort
        </label>
        <input
          id="passwort"
          name="passwort"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          className="mt-1 w-full rounded-md border border-neutral-300 p-2"
        />
        <p className="mt-1 text-xs text-neutral-500">
          Mindestens 10 Zeichen. Am besten im Passwortspeicher ablegen.
        </p>
      </div>

      <div>
        <label
          htmlFor="passwort_wiederholung"
          className="block text-sm font-medium"
        >
          Noch einmal zur Sicherheit
        </label>
        <input
          id="passwort_wiederholung"
          name="passwort_wiederholung"
          type="password"
          autoComplete="new-password"
          required
          className="mt-1 w-full rounded-md border border-neutral-300 p-2"
        />
      </div>

      {zustand.fehler && (
        <p className="text-sm text-red-700" role="alert">
          {zustand.fehler}
        </p>
      )}

      <button
        type="submit"
        disabled={laeuft}
        className="rounded-md bg-neutral-900 px-4 py-2 font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
      >
        {laeuft ? "Wird gespeichert …" : "Passwort speichern"}
      </button>
    </form>
  );
}
