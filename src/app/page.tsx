import Link from "next/link";

import { db } from "@/lib/db";
import { formatEuro } from "@/lib/geld";
import { preisHinweis } from "@/lib/preis-hinweis";

/**
 * Öffentlicher Katalog.
 *
 * Server Component: die Produktdaten werden auf dem Server geladen und nur
 * fertiges HTML ausgeliefert. Preise kommen dadurch immer aus der Datenbank
 * und nie aus dem Browser — im Frontend manipulierte Preise gibt es hier nicht.
 */
export default async function Startseite({ searchParams }: PageProps<"/">) {
  const parameter = await searchParams;
  const suche = typeof parameter.suche === "string" ? parameter.suche : "";
  const kategorie =
    typeof parameter.kategorie === "string" ? parameter.kategorie : "";

  const [produkte, kategorien] = await Promise.all([
    db().katalog({ suche, kategorie }),
    db().kategorien(),
  ]);

  return (
    <div>
      <section className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          Digitale Produkte, sofort zum Download
        </h1>
        <p className="mt-2 max-w-2xl text-neutral-600">
          E-Books, Vorlagen, Presets und Kurse von unabhängigen Verkäufern. Nach
          dem Kauf bekommst du den Download-Link sofort per E-Mail.
        </p>
        {/*
          Einstieg in die Themenseite. Sie ist der Teil des Marktplatzes, den
          Suchmaschinen überhaupt bewerten können — Produktkacheln allein
          ranken für nichts.
        */}
        <p className="mt-3 text-sm">
          <Link href="/automaten" className="underline hover:no-underline">
            Für Automatenaufsteller: Rechnet sich ein Snackautomat?
          </Link>
        </p>
      </section>

      <form className="mb-6 flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <label
            htmlFor="suche"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            Suche
          </label>
          <input
            id="suche"
            name="suche"
            type="search"
            defaultValue={suche}
            placeholder="z. B. Notion-Vorlage"
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>

        <div className="min-w-48">
          <label
            htmlFor="kategorie"
            className="mb-1 block text-sm font-medium text-neutral-700"
          >
            Kategorie
          </label>
          <select
            id="kategorie"
            name="kategorie"
            defaultValue={kategorie}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2"
          >
            <option value="">Alle Kategorien</option>
            {kategorien.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 font-medium text-white hover:bg-neutral-700"
        >
          Filtern
        </button>
        {(suche || kategorie) && (
          <Link
            href="/"
            className="rounded-md px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100"
          >
            Zurücksetzen
          </Link>
        )}
      </form>

      {produkte.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 p-10 text-center text-neutral-500">
          {suche || kategorie
            ? "Zu dieser Suche gibt es noch keine Produkte."
            : "Es sind noch keine Produkte freigeschaltet."}
        </p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {produkte.map((produkt) => (
            <li key={produkt.id}>
              <Link
                href={`/produkt/${produkt.id}`}
                className="flex h-full flex-col rounded-lg border border-neutral-200 p-4 transition hover:border-neutral-400"
              >
                <span className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
                  {produkt.kategorie}
                </span>
                <h2 className="mt-1 font-semibold">{produkt.titel}</h2>
                <p className="mt-2 line-clamp-3 flex-1 text-sm text-neutral-600">
                  {produkt.beschreibung}
                </p>
                <div className="mt-4">
                  <span className="text-lg font-semibold">
                    {formatEuro(produkt.preis_cent)}
                  </span>
                  {/*
                    Preisangabenverordnung: Der Hinweis muss zutreffen.
                    Kleinunternehmer weisen keine USt aus — siehe preis-hinweis.ts.
                  */}
                  <span className="mt-0.5 block text-xs text-neutral-500">
                    {preisHinweis(produkt.verkaeufer.kleinunternehmer)}
                  </span>
                </div>
                <span className="mt-1 text-xs text-neutral-500">
                  von {produkt.verkaeufer.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
