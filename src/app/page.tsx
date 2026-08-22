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
      <section className="mb-14 pt-6 text-center sm:pt-10">
        <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-[-0.02em] text-balance sm:text-5xl">
          Digitale Produkte,
          <br className="hidden sm:block" /> sofort einsatzbereit.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-neutral-500">
          E-Books, Vorlagen, Presets und Kurse von unabhängigen Verkäufern.
          Nach dem Kauf bekommst du den Download-Link sofort per E-Mail.
        </p>
        {/*
          Einstieg in die Themenseite. Sie ist der Teil des Marktplatzes, den
          Suchmaschinen überhaupt bewerten können — Produktkacheln allein
          ranken für nichts.
        */}
        <p className="mt-5 text-sm">
          <Link
            href="/automaten"
            className="text-neutral-500 underline decoration-neutral-300 underline-offset-4 transition hover:text-neutral-900 hover:decoration-neutral-900"
          >
            Für Automatenaufsteller: Rechnet sich ein Snackautomat?
          </Link>
        </p>
      </section>

      <form className="mb-10 flex flex-wrap items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50/60 p-3">
        <div className="min-w-56 flex-1">
          <label htmlFor="suche" className="sr-only">
            Suche
          </label>
          <input
            id="suche"
            name="suche"
            type="search"
            defaultValue={suche}
            placeholder="Wonach suchst du?"
            className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none placeholder:text-neutral-400 focus:border-neutral-400"
          />
        </div>

        <div className="min-w-44">
          <label htmlFor="kategorie" className="sr-only">
            Kategorie
          </label>
          <select
            id="kategorie"
            name="kategorie"
            defaultValue={kategorie}
            className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-neutral-400"
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
          className="rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700"
        >
          Filtern
        </button>
        {(suche || kategorie) && (
          <Link
            href="/"
            className="rounded-xl px-3 py-2.5 text-sm text-neutral-500 transition hover:text-neutral-900"
          >
            Zurücksetzen
          </Link>
        )}
      </form>

      {produkte.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-300 p-16 text-center text-neutral-500">
          {suche || kategorie
            ? "Zu dieser Suche gibt es noch keine Produkte."
            : "Es sind noch keine Produkte freigeschaltet."}
        </p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {produkte.map((produkt) => (
            <li key={produkt.id}>
              <Link
                href={`/produkt/${produkt.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-lg hover:shadow-neutral-200/60"
              >
                <div
                  className={`flex aspect-[4/3] items-center justify-center ${platzhalterKlasse(produkt.kategorie)}`}
                >
                  <span className="text-4xl font-semibold text-neutral-400/70 select-none">
                    {produkt.titel.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <span className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
                    {produkt.kategorie}
                  </span>
                  <h2 className="mt-1.5 font-semibold tracking-[-0.01em]">
                    {produkt.titel}
                  </h2>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm text-neutral-500">
                    {produkt.beschreibung}
                  </p>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <span className="text-lg font-semibold">
                        {formatEuro(produkt.preis_cent)}
                      </span>
                      {/*
                        Preisangabenverordnung: Der Hinweis muss zutreffen.
                        Kleinunternehmer weisen keine USt aus — siehe preis-hinweis.ts.
                      */}
                      <span className="mt-0.5 block text-xs text-neutral-400">
                        {preisHinweis(produkt.verkaeufer.kleinunternehmer)}
                      </span>
                    </div>
                    <span className="text-xs text-neutral-400">
                      {produkt.verkaeufer.name}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Ordnet jeder Kategorie einen eigenen sanften Verlaufston zu, damit
 * Produkte ohne eigenes Vorschaubild trotzdem unterscheidbar wirken. */
function platzhalterKlasse(kategorie: string): string {
  const key = kategorie.toLowerCase();
  if (key.includes("vorlage") || key.includes("template"))
    return "platzhalter-vorlage";
  if (key.includes("dokument") || key.includes("vertrag"))
    return "platzhalter-doc";
  if (key.includes("finanz") || key.includes("euer") || key.includes("steuer"))
    return "platzhalter-eur";
  return "platzhalter-standard";
}
