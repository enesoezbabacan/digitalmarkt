import type { Metadata } from "next";
import Link from "next/link";

import { db } from "@/lib/db";
import { formatEuro } from "@/lib/geld";
import { preisHinweis } from "@/lib/preis-hinweis";
import { absolut } from "@/lib/seo";

/**
 * Themenseite für Automatenaufsteller.
 *
 * Warum es diese Seite gibt: Der Katalog selbst rankt bei Google für nichts —
 * er besteht aus Produktkacheln ohne Text. Wer "Snackautomat aufstellen
 * lohnt sich" sucht, sucht nach Antworten, nicht nach einem Shop. Diese Seite
 * beantwortet die Frage und führt von dort zu den Vorlagen.
 *
 * Die Produkte werden nicht fest verdrahtet, sondern aus dem Katalog geholt.
 * Solange sie auf "Entwurf" stehen, zeigt die Seite nur den Text — kein toter
 * Link auf ein Produkt, das es öffentlich nicht gibt.
 */

const TITEL = "Snackautomat aufstellen: Rechnet sich das? — Digitalmarkt";
const BESCHREIBUNG =
  "Was ein Verkaufsautomat wirklich kostet, wie man Standorte bewertet und ab wie vielen Verkäufen am Tag er sich trägt. Mit Vorlagen zum Nachrechnen.";

export const metadata: Metadata = {
  title: "Snackautomat aufstellen: Rechnet sich das?",
  description: BESCHREIBUNG,
  alternates: { canonical: absolut("/automaten") },
  openGraph: {
    type: "article",
    locale: "de_DE",
    url: absolut("/automaten"),
    title: TITEL,
    description: BESCHREIBUNG,
  },
};

export const dynamic = "force-dynamic";

/** Absatz mit Überschrift — hält die Seite unten lesbar. */
function Abschnitt({
  titel,
  children,
}: {
  titel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold tracking-tight">{titel}</h2>
      <div className="mt-3 space-y-3 text-neutral-700">{children}</div>
    </section>
  );
}

export default async function Automatenseite() {
  // Produkte dieser Nische erkennen wir am Titel. Bewusst keine eigene
  // Datenbankspalte: Ein zusätzliches Feld müsste bei jedem Produkt gepflegt
  // werden, und eine falsch gesetzte Zuordnung fiele niemandem auf.
  //
  // Die Suche der Datenschicht durchsucht auch die Beschreibung — dabei
  // rutschen Produkte mit "automatisch" im Text mit herein (Rechnungsvorlage,
  // Fahrtenbuch). Deshalb wird das Ergebnis hier noch einmal auf den Titel
  // eingeengt.
  let produkte: Awaited<ReturnType<ReturnType<typeof db>["katalog"]>> = [];
  try {
    const treffer = await db().katalog({ suche: "Automat" });
    // "Automat", "Automaten", "Automatenaufsteller" — aber nicht
    // "automatischer Pflichtangaben-Prüfung".
    produkte = treffer.filter((p) => /\bautomat(?:en\w*|\b)/i.test(p.titel));
  } catch {
    produkte = [];
  }

  return (
    <article className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-semibold tracking-tight">
        Snackautomat aufstellen: Rechnet sich das?
      </h1>
      <p className="mt-3 text-lg text-neutral-600">
        Die ehrliche Antwort: Ein einzelner Automat mit eigener Anfahrt trägt
        sich selten. Als Teil einer Tour trägt er sich fast immer. Der
        Unterschied liegt nicht am Automaten, sondern an der Rechnung
        dahinter.
      </p>

      <Abschnitt titel="Was in Überschlagsrechnungen fehlt">
        <p>
          Die übliche Rechnung lautet: Automat kostet X, Ware kostet Y, Rest
          ist Gewinn. Sie geht regelmäßig schief, weil vier Posten fehlen:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Die Befüllfahrt.</strong> Kilometer, Zeit und dein eigener
            Stundensatz. Wer sich selbst mit null Euro ansetzt, rechnet sich
            reich.
          </li>
          <li>
            <strong>Der Strom.</strong> Ein Kühlgerät läuft rund um die Uhr.
            Wer zahlt ihn — du oder der Standort? Das gehört in den Vertrag,
            nicht ins Vertrauen.
          </li>
          <li>
            <strong>Schwund und Verfall.</strong> Abgelaufene Ware, defekte
            Ausgabe, gelegentlicher Vandalismus.
          </li>
          <li>
            <strong>Die Reparaturrücklage.</strong> Kein Automat läuft zehn
            Jahre ohne Techniker.
          </li>
        </ul>
      </Abschnitt>

      <Abschnitt titel="Feste Miete oder Umsatzbeteiligung?">
        <p>
          Standorte bieten beides an. Die Umsatzbeteiligung klingt fairer, weil
          sie bei schwachem Umsatz mitfällt. Sie kann aber teurer sein als jede
          Miete: Rechnet der Standort mit fünfzehn Prozent vom{" "}
          <em>Brutto</em>, gehen davon erst Umsatzsteuer und Wareneinsatz ab —
          und der Rest kann kleiner sein als deine gesamte Marge.
        </p>
        <p>
          Beide Modelle lassen sich nur vergleichen, wenn man sie mit denselben
          Zahlen gegenüberstellt. Genau dafür ist der Rentabilitätsrechner
          gebaut.
        </p>
      </Abschnitt>

      <Abschnitt titel="Woran gute Standorte erkennbar sind">
        <p>
          Nicht an der Zahl der Menschen, sondern daran, wie lange sie bleiben
          und ob sie eine Alternative haben. Eine Werkhalle mit
          Schichtbetrieb und ohne Kiosk in der Nähe schlägt eine belebte
          Fußgängerzone mit drei Bäckereien.
        </p>
        <p>Vor der Zusage geklärt sein sollten:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Stromanschluss in Reichweite, und wer ihn bezahlt</li>
          <li>Zugang außerhalb der Öffnungszeiten zum Befüllen</li>
          <li>Tragfähiger, ebener Untergrund und genug Stellfläche</li>
          <li>Laufzeit, Kündigungsfrist und was bei Eigentümerwechsel gilt</li>
          <li>Haftung bei Beschädigung und Diebstahl</li>
        </ul>
      </Abschnitt>

      <Abschnitt titel="Ab wann trägt sich der Automat?">
        <p>
          Die einzige Kennzahl, die zählt, ist der Break-even in{" "}
          <strong>Verkäufen pro Tag</strong> — nicht im Monatsumsatz. Sie lässt
          sich am Standort prüfen: Man stellt sich hin und zählt, wie viele
          Leute in einer Stunde vorbeikommen. Ein Monatsumsatz lässt sich nicht
          zählen, eine Verkaufszahl schon.
        </p>
      </Abschnitt>

      {produkte.length > 0 && (
        <section className="mt-12 border-t border-neutral-200 pt-8">
          <h2 className="text-xl font-semibold tracking-tight">
            Vorlagen zum Nachrechnen
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {produkte.map((produkt) => (
              <li key={produkt.id}>
                <Link
                  href={`/produkt/${produkt.id}`}
                  className="flex h-full flex-col rounded-lg border border-neutral-200 p-4 transition hover:border-neutral-400"
                >
                  <h3 className="font-semibold">{produkt.titel}</h3>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm text-neutral-600">
                    {produkt.beschreibung}
                  </p>
                  <span className="mt-3 text-lg font-semibold">
                    {formatEuro(produkt.preis_cent)}
                  </span>
                  <span className="text-xs text-neutral-500">
                    {preisHinweis(produkt.verkaeufer.kleinunternehmer)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-10 border-t border-neutral-200 pt-6 text-sm text-neutral-500">
        Die Angaben auf dieser Seite sind Erfahrungswerte aus der Praxis und
        keine Zusicherung. Ob sich ein bestimmter Standort trägt, hängt von
        Lage, Sortiment und Vertrag ab. Fragen zu Umsatzsteuer und Buchführung
        gehören zum Steuerberater.
      </p>
    </article>
  );
}
