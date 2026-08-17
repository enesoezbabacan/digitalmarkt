import type { Metadata } from "next";

import { db } from "@/lib/db";
import { MeldeFormular } from "./formular";

export const metadata: Metadata = {
  title: "Rechtsverletzung melden",
  description:
    "Meldeverfahren nach Art. 16 DSA: rechtswidrige Inhalte auf dem Marktplatz melden.",
};

// Der Katalog ändert sich, und das Formular muss die aktuellen Produkte zur
// Auswahl stellen.
export const dynamic = "force-dynamic";

export default async function Seite({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const werte = await searchParams;
  const roh = werte.produkt;
  const vorauswahl = typeof roh === "string" ? roh : undefined;

  const katalog = await db().katalog();
  const produkte = katalog.map((p) => ({
    id: p.id,
    titel: p.titel,
    verkaeufer: p.verkaeufer.name,
  }));

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">
        Rechtsverletzung melden
      </h1>
      <p className="text-neutral-600">
        Über dieses Formular kannst du uns Produkte melden, die deiner Ansicht
        nach rechtswidrig sind oder Rechte verletzen. Du brauchst dafür kein
        Konto.
      </p>

      <div className="not-prose my-8 rounded-lg border border-neutral-200 bg-neutral-50 p-5 text-sm">
        <h2 className="font-semibold">Wie es weitergeht</h2>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-neutral-700">
          <li>
            Du bekommst sofort eine Bestätigung, dass die Meldung angekommen
            ist.
          </li>
          <li>Wir prüfen sie sorgfältig und ohne unnötige Verzögerung.</li>
          <li>
            Wir teilen dir unsere Entscheidung mit und begründen sie. Erweist
            sich die Meldung als berechtigt, nehmen wir das Produkt aus dem
            Katalog.
          </li>
          <li>
            Bist du mit der Entscheidung nicht einverstanden, kannst du dich an
            eine außergerichtliche Streitbeilegungsstelle nach Art. 21 DSA
            wenden. Der Rechtsweg bleibt davon unberührt.
          </li>
        </ol>
        <p className="mt-4 text-neutral-600">
          Dieses Verfahren setzt Art. 16 der Verordnung (EU) 2022/2065 über
          digitale Dienste (DSA) um.
        </p>
      </div>

      <div className="not-prose my-8 rounded-lg border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
        <p>
          <strong>Bitte nur ernst gemeinte Meldungen.</strong> Wer wiederholt
          offensichtlich unbegründete Meldungen einreicht, kann nach Art. 23
          Abs. 2 DSA von diesem Verfahren ausgeschlossen werden.
        </p>
        <p className="mt-3">
          Geht es dir um einen <strong>Kauf</strong> — Datei nicht erhalten,
          Inhalt fehlerhaft — wende dich bitte zuerst an den Verkäufer. Der
          Kaufvertrag besteht zwischen dir und ihm. Wir helfen weiter, wenn das
          nicht zum Ziel führt.
        </p>
      </div>

      <div className="not-prose mt-8">
        {produkte.length === 0 ? (
          <p className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-500">
            Zurzeit sind keine Produkte im Katalog. Es gibt daher nichts zu
            melden.
          </p>
        ) : (
          <MeldeFormular produkte={produkte} vorauswahl={vorauswahl} />
        )}
      </div>
    </>
  );
}
