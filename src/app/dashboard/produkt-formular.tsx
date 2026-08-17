"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { produktAnlegen, type ProduktZustand } from "./aktionen";
import { KATEGORIEN } from "@/lib/kategorien";
import { PROVISION_PROZENT } from "@/lib/geld";

function Absenden() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-neutral-900 px-4 py-2.5 font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-400"
    >
      {pending ? "Wird hochgeladen…" : "Als Entwurf speichern"}
    </button>
  );
}

const START: ProduktZustand = {};

export function ProduktFormular({ gesperrt }: { gesperrt?: string }) {
  const [zustand, aktion] = useActionState(produktAnlegen, START);

  if (gesperrt) {
    return (
      <p className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        {gesperrt}
      </p>
    );
  }

  return (
    <form action={aktion} className="space-y-4">
      {zustand.fehler && (
        <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {zustand.fehler}
        </p>
      )}
      {zustand.erfolg && (
        <p className="rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-900">
          {zustand.erfolg}
        </p>
      )}

      <div>
        <label htmlFor="titel" className="mb-1 block text-sm font-medium">
          Titel
        </label>
        <input
          id="titel"
          name="titel"
          required
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="beschreibung" className="mb-1 block text-sm font-medium">
          Beschreibung
        </label>
        <textarea
          id="beschreibung"
          name="beschreibung"
          rows={5}
          required
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="kategorie" className="mb-1 block text-sm font-medium">
            Kategorie
          </label>
          <select
            id="kategorie"
            name="kategorie"
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2"
          >
            {KATEGORIEN.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="preis" className="mb-1 block text-sm font-medium">
            Preis in Euro
          </label>
          <input
            id="preis"
            name="preis"
            inputMode="decimal"
            placeholder="19,90"
            required
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          />
          <p className="mt-1 text-xs text-neutral-500">
            Davon behält der Marktplatz {PROVISION_PROZENT} % Provision.
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="datei" className="mb-1 block text-sm font-medium">
          Produktdatei
        </label>
        <input
          id="datei"
          name="datei"
          type="file"
          required
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-neutral-100 file:px-3 file:py-1.5"
        />
        <p className="mt-1 text-xs text-neutral-500">
          Das ist die Datei, die der Käufer nach der Zahlung herunterlädt.
          Maximal 50 MB. Sie liegt geschützt und ist ohne Kauf nicht abrufbar.
        </p>
      </div>

      <Absenden />
    </form>
  );
}
