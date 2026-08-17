"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { ERLAUBTE_LAENDER, LAENDER_NAMEN } from "@/lib/validation/verkaeufer";
import { registrieren, type FormularZustand } from "./aktionen";

function Feld({
  name,
  label,
  hinweis,
  fehler,
  wert,
  ...rest
}: {
  name: string;
  label: string;
  hinweis?: string;
  fehler?: string;
  wert?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium">
        {label}
        {rest.required && <span className="ml-1 text-red-600">*</span>}
      </label>
      <input
        id={name}
        name={name}
        defaultValue={wert}
        aria-invalid={fehler ? true : undefined}
        aria-describedby={fehler ? `${name}-fehler` : undefined}
        className={`w-full rounded-md border px-3 py-2 ${
          fehler ? "border-red-500 bg-red-50" : "border-neutral-300"
        }`}
        {...rest}
      />
      {hinweis && !fehler && (
        <p className="mt-1 text-xs text-neutral-500">{hinweis}</p>
      )}
      {fehler && (
        <p id={`${name}-fehler`} className="mt-1 text-sm text-red-700">
          {fehler}
        </p>
      )}
    </div>
  );
}

function AbsendeButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-neutral-900 px-4 py-3 font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-400"
    >
      {pending ? "Wird geprüft…" : "Verkäuferkonto anlegen"}
    </button>
  );
}

const START: FormularZustand = {};

export function RegistrierungsFormular() {
  const [zustand, aktion] = useActionState(registrieren, START);
  const f = zustand.fehler ?? {};
  const w = zustand.werte ?? {};

  return (
    <form action={aktion} className="space-y-6" noValidate>
      {zustand.allgemeinerFehler && (
        <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {zustand.allgemeinerFehler}
        </p>
      )}

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">Zugangsdaten</legend>

        <Feld
          name="email"
          label="E-Mail-Adresse"
          type="email"
          autoComplete="email"
          required
          wert={w.email}
          fehler={f.email}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Feld
            name="passwort"
            label="Passwort"
            type="password"
            autoComplete="new-password"
            required
            hinweis="Mindestens 10 Zeichen."
            fehler={f.passwort}
          />
          <Feld
            name="passwort_wiederholung"
            label="Passwort wiederholen"
            type="password"
            autoComplete="new-password"
            required
            fehler={f.passwort_wiederholung}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">
          Angaben zu deinem Unternehmen
        </legend>
        <p className="text-sm text-neutral-600">
          Diese Angaben sind gesetzlich vorgeschrieben (Art. 30 DSA). Ohne sie
          kannst du kein Produkt einstellen.
        </p>

        <Feld
          name="name"
          label="Name oder Firmenname"
          required
          autoComplete="organization"
          hinweis="Genau so, wie es im Gewerbeschein steht."
          wert={w.name}
          fehler={f.name}
        />

        <Feld
          name="strasse"
          label="Straße und Hausnummer"
          required
          autoComplete="street-address"
          hinweis="Ladungsfähige Anschrift. Ein Postfach oder eine Packstation reicht nicht."
          wert={w.strasse}
          fehler={f.strasse}
        />

        <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
          <Feld
            name="plz"
            label="PLZ"
            required
            autoComplete="postal-code"
            wert={w.plz}
            fehler={f.plz}
          />
          <Feld
            name="ort"
            label="Ort"
            required
            autoComplete="address-level2"
            wert={w.ort}
            fehler={f.ort}
          />
        </div>

        <div>
          <label htmlFor="land" className="mb-1 block text-sm font-medium">
            Land<span className="ml-1 text-red-600">*</span>
          </label>
          <select
            id="land"
            name="land"
            defaultValue={w.land || "DE"}
            className={`w-full rounded-md border bg-white px-3 py-2 ${
              f.land ? "border-red-500 bg-red-50" : "border-neutral-300"
            }`}
          >
            {ERLAUBTE_LAENDER.map((code) => (
              <option key={code} value={code}>
                {LAENDER_NAMEN[code]}
              </option>
            ))}
          </select>
          {f.land && <p className="mt-1 text-sm text-red-700">{f.land}</p>}
        </div>

        <Feld
          name="telefon"
          label="Telefonnummer"
          type="tel"
          required
          autoComplete="tel"
          hinweis="Wird für Rückfragen im Streitfall gebraucht."
          wert={w.telefon}
          fehler={f.telefon}
        />

        <Feld
          name="steuernummer"
          label="Steuernummer"
          required
          hinweis="Pflichtangabe. Ohne Steuernummer ist kein Verkauf möglich."
          wert={w.steuernummer}
          fehler={f.steuernummer}
        />

        <Feld
          name="ust_id"
          label="USt-IdNr. (falls vorhanden)"
          placeholder="DE123456789"
          hinweis="Wird automatisch gegen die EU-Datenbank geprüft."
          wert={w.ust_id}
          fehler={f.ust_id}
        />
      </fieldset>

      <div>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="rechte_bestaetigt"
            className="mt-1 size-4 shrink-0"
          />
          <span>
            Ich bestätige, dass ich die Rechte an allen Inhalten halte, die ich
            hier einstelle, und dass ich damit keine fremden Rechte verletze.
            <span className="ml-1 text-red-600">*</span>
          </span>
        </label>
        {f.rechte_bestaetigt && (
          <p className="mt-1 text-sm text-red-700">{f.rechte_bestaetigt}</p>
        )}
      </div>

      {/*
        Getrenntes Häkchen für die Vertragsannahme. Bewusst nicht mit der
        Rechtebestätigung zusammengelegt: Wer zwei verschiedene Erklärungen in
        ein Häkchen packt, hat am Ende keine davon sauber.

        Die Links öffnen in einem neuen Tab, damit das ausgefüllte Formular
        beim Nachlesen nicht verlorengeht.
      */}
      <div>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="bedingungen_akzeptiert"
            className="mt-1 size-4 shrink-0"
          />
          <span>
            Ich habe die{" "}
            <a href="/agb" target="_blank" rel="noopener" className="underline">
              Allgemeinen Geschäftsbedingungen
            </a>{" "}
            und den{" "}
            <a
              href="/verkaeufervertrag"
              target="_blank"
              rel="noopener"
              className="underline"
            >
              Verkäufervertrag
            </a>{" "}
            gelesen und stimme ihnen zu. Mir ist bekannt, dass ich als
            Unternehmer verkaufe und den Kaufvertrag selbst mit dem Käufer
            schließe.
            <span className="ml-1 text-red-600">*</span>
          </span>
        </label>
        {f.bedingungen_akzeptiert && (
          <p className="mt-1 text-sm text-red-700">
            {f.bedingungen_akzeptiert}
          </p>
        )}
      </div>

      <AbsendeButton />

      <p className="text-xs text-neutral-500">
        Mit * markierte Felder sind Pflichtfelder.
      </p>
    </form>
  );
}
