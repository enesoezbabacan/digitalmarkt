"use client";

import { useActionState, useEffect, useState } from "react";

import { MELDEGRUENDE } from "@/lib/validation/meldung";
import { meldungSenden } from "./aktionen";

type Produkt = { id: string; titel: string; verkaeufer: string };

const felderKlasse =
  "mt-1 w-full rounded-md border border-neutral-300 p-2 text-sm";

function Fehler({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <p className="mt-1 text-sm text-red-700" role="alert">
      {text}
    </p>
  );
}

export function MeldeFormular({
  produkte,
  vorauswahl,
}: {
  produkte: Produkt[];
  vorauswahl?: string;
}) {
  const [zustand, absenden, laeuft] = useActionState(meldungSenden, {});

  /**
   * Die beiden Auswahlfelder werden bewusst kontrolliert geführt.
   *
   * Mit `defaultValue` allein verliert ein <select> seine Auswahl, sobald die
   * Aktion einen Fehler zurückgibt und React neu rendert. Der Melder hat dann
   * eine Fehlermeldung vor sich UND muss seine Auswahl noch einmal treffen,
   * ohne zu sehen, dass sie weg ist — er schickt dasselbe Formular ab und
   * bekommt einen neuen Fehler. Bei Textfeldern fällt das nicht auf, bei
   * Auswahlfeldern schon.
   */
  const [produktId, setProduktId] = useState(vorauswahl ?? "");
  const [kategorie, setKategorie] = useState("");

  // Was der Server zurückmeldet, gewinnt — er kennt den zuletzt abgeschickten
  // Stand.
  useEffect(() => {
    if (zustand.werte?.produkt_id) setProduktId(zustand.werte.produkt_id);
    if (zustand.werte?.kategorie) setKategorie(zustand.werte.kategorie);
  }, [zustand.werte]);

  if (zustand.erfolg) {
    return (
      <div className="rounded-lg border border-green-300 bg-green-50 p-6">
        <h2 className="text-lg font-semibold text-green-900">
          Deine Meldung ist eingegangen
        </h2>
        <p className="mt-2 text-sm text-green-900">
          Wir haben dir eine Eingangsbestätigung geschickt und prüfen die
          Meldung. Du bekommst unsere Entscheidung mit Begründung per E-Mail.
        </p>
      </div>
    );
  }

  const f = zustand.fehler ?? {};
  const w = zustand.werte ?? {};

  return (
    <form action={absenden} className="space-y-5">
      {zustand.allgemeinerFehler && (
        <p
          className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800"
          role="alert"
        >
          {zustand.allgemeinerFehler}
        </p>
      )}

      <div>
        <label htmlFor="produkt_id" className="block text-sm font-medium">
          Betroffenes Produkt
        </label>
        <select
          id="produkt_id"
          name="produkt_id"
          value={produktId}
          onChange={(e) => setProduktId(e.target.value)}
          className={felderKlasse}
        >
          <option value="">Bitte auswählen …</option>
          {produkte.map((p) => (
            <option key={p.id} value={p.id}>
              {p.titel} — {p.verkaeufer}
            </option>
          ))}
        </select>
        <Fehler text={f.produkt_id} />
      </div>

      <div>
        <label htmlFor="kategorie" className="block text-sm font-medium">
          Worum geht es?
        </label>
        <select
          id="kategorie"
          name="kategorie"
          value={kategorie}
          onChange={(e) => setKategorie(e.target.value)}
          className={felderKlasse}
        >
          <option value="">Bitte auswählen …</option>
          {MELDEGRUENDE.map((grund) => (
            <option key={grund} value={grund}>
              {grund}
            </option>
          ))}
        </select>
        <Fehler text={f.kategorie} />
      </div>

      <div>
        <label htmlFor="begruendung" className="block text-sm font-medium">
          Begründung
        </label>
        <textarea
          id="begruendung"
          name="begruendung"
          rows={7}
          defaultValue={w.begruendung}
          className={felderKlasse}
          placeholder="Beschreibe möglichst genau, worin die Rechtsverletzung liegt. Wenn du Rechteinhaber bist: woran erkennt man das? Je genauer die Angaben, desto schneller können wir entscheiden."
        />
        <Fehler text={f.begruendung} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="melder_email" className="block text-sm font-medium">
            Deine E-Mail-Adresse
          </label>
          <input
            id="melder_email"
            name="melder_email"
            type="email"
            defaultValue={w.melder_email}
            className={felderKlasse}
          />
          <p className="mt-1 text-xs text-neutral-500">
            Für die Eingangsbestätigung und unsere Entscheidung.
          </p>
          <Fehler text={f.melder_email} />
        </div>

        <div>
          <label htmlFor="melder_name" className="block text-sm font-medium">
            Dein Name <span className="text-neutral-500">(freiwillig)</span>
          </label>
          <input
            id="melder_name"
            name="melder_name"
            type="text"
            defaultValue={w.melder_name}
            className={felderKlasse}
          />
          <Fehler text={f.melder_name} />
        </div>
      </div>

      <div className="rounded-md border border-neutral-300 p-4">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="richtigkeit_bestaetigt"
            className="mt-0.5 h-4 w-4"
          />
          <span>
            Ich bestätige nach bestem Wissen und Gewissen, dass meine Angaben
            richtig und vollständig sind.
          </span>
        </label>
        <Fehler text={f.richtigkeit_bestaetigt} />
      </div>

      <button
        type="submit"
        disabled={laeuft}
        className="rounded-md bg-neutral-900 px-5 py-2.5 font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
      >
        {laeuft ? "Wird gesendet …" : "Meldung absenden"}
      </button>
    </form>
  );
}
