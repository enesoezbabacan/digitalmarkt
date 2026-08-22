"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { kaufStarten, type KaufZustand } from "./kauf-aktionen";

function KaufButton({ gesperrt }: { gesperrt: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || gesperrt}
      className="mt-4 w-full rounded-xl bg-neutral-900 px-4 py-3 font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
    >
      {/*
        § 312j Abs. 3 BGB verlangt genau diese (oder eine gleich eindeutige)
        Beschriftung. Steht dort etwas Unverbindliches wie "Weiter", kommt
        gar kein wirksamer Vertrag zustande.
      */}
      {pending ? "Weiterleitung zu Stripe…" : "Zahlungspflichtig bestellen"}
    </button>
  );
}

const START: KaufZustand = {};

export function KaufFormular({
  produktId,
  verkaeuferBereit,
}: {
  produktId: string;
  verkaeuferBereit: boolean;
}) {
  const [zustand, aktion] = useActionState(kaufStarten, START);

  if (!verkaeuferBereit) {
    return (
      <p className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        Dieser Verkäufer hat seine Verifizierung noch nicht abgeschlossen und
        kann derzeit keine Zahlungen empfangen.
      </p>
    );
  }

  return (
    <form action={aktion} className="mt-5">
      <input type="hidden" name="produkt_id" value={produktId} />

      {zustand.fehler && (
        <p className="mb-3 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {zustand.fehler}
        </p>
      )}

      <label htmlFor="kaeufer_email" className="mb-1 block text-sm font-medium">
        E-Mail-Adresse
      </label>
      <input
        id="kaeufer_email"
        name="kaeufer_email"
        type="email"
        required
        placeholder="du@beispiel.de"
        className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 outline-none focus:border-neutral-500"
      />
      <p className="mt-1 text-xs text-neutral-500">
        An diese Adresse geht dein Download-Link.
      </p>

      {/*
        § 356 Abs. 5 BGB: Bei digitalen Inhalten erlischt das Widerrufsrecht nur,
        wenn der Käufer der sofortigen Ausführung ausdrücklich zustimmt UND
        bestätigt, dass er dadurch sein Widerrufsrecht verliert. Ohne diese
        Erklärung kann er 14 Tage lang widerrufen — mit der Datei in der Hand.
      */}
      <label className="mt-4 flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          name="widerruf_verzicht"
          required
          className="mt-1 size-4 shrink-0"
        />
        <span className="text-neutral-700">
          Ich verlange ausdrücklich, dass die Auslieferung sofort beginnt. Mir
          ist bekannt, dass ich damit mein Widerrufsrecht verliere, sobald der
          Download bereitsteht.
        </span>
      </label>

      <KaufButton gesperrt={false} />

      <p className="mt-2 text-center text-xs text-neutral-500">
        Zahlung über Stripe. Wir speichern keine Zahlungsdaten.
      </p>
    </form>
  );
}
