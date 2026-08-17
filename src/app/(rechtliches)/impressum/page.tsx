import type { Metadata } from "next";

import { ANBIETER } from "@/lib/anbieter";
import { Rechtshinweis } from "../hinweis";

export const metadata: Metadata = { title: "Impressum" };

export default function Seite() {
  return (
    <>
      <Rechtshinweis />

      <h1 className="text-3xl font-semibold tracking-tight">Impressum</h1>

      <h2 className="mt-8 text-xl font-semibold">Angaben gemäß § 5 DDG</h2>
      <p className="whitespace-pre-line text-neutral-800">
        {ANBIETER.name}
        {"\n"}
        {ANBIETER.geschaeftsbezeichnung}
        {"\n"}
        {ANBIETER.strasse}
        {"\n"}
        {ANBIETER.plz} {ANBIETER.ort}
        {"\n"}
        {ANBIETER.land}
      </p>
      <p className="text-sm text-neutral-600">
        Rechtsform: {ANBIETER.rechtsform}
      </p>

      <h2 className="mt-8 text-xl font-semibold">Kontakt</h2>
      <p className="text-neutral-800">
        E-Mail:{" "}
        <a href={`mailto:${ANBIETER.email}`} className="underline">
          {ANBIETER.email}
        </a>
        {ANBIETER.telefon && (
          <>
            <br />
            Telefon: {ANBIETER.telefon}
          </>
        )}
      </p>

      <h2 className="mt-8 text-xl font-semibold">Umsatzsteuer</h2>
      {ANBIETER.ustIdNr ? (
        <p className="text-neutral-800">
          Umsatzsteuer-Identifikationsnummer nach § 27a UStG: {ANBIETER.ustIdNr}
        </p>
      ) : (
        <p className="text-neutral-800">
          Gemäß § 19 UStG wird keine Umsatzsteuer berechnet und daher auch keine
          Umsatzsteuer ausgewiesen (Kleinunternehmerregelung). Eine
          Umsatzsteuer-Identifikationsnummer nach § 27a UStG liegt nicht vor.
        </p>
      )}

      <h2 className="mt-8 text-xl font-semibold">
        Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
      </h2>
      <p className="whitespace-pre-line text-neutral-800">
        {ANBIETER.name}
        {"\n"}
        {ANBIETER.strasse}
        {"\n"}
        {ANBIETER.plz} {ANBIETER.ort}
      </p>

      <h2 className="mt-8 text-xl font-semibold">Rolle dieser Website</h2>
      <p className="text-neutral-800">
        {ANBIETER.domain} ist ein Online-Marktplatz. Die angebotenen Produkte
        stammen von unabhängigen Verkäufern. Kaufverträge kommen ausschließlich
        zwischen dem Käufer und dem jeweiligen Verkäufer zustande, nicht mit dem
        Betreiber dieser Website. Die Angaben zum Verkäufer sind auf jeder
        Produktseite ausgewiesen.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Streitbeilegung</h2>
      <p className="text-neutral-800">
        Wir sind weder bereit noch verpflichtet, an Streitbeilegungsverfahren
        vor einer Verbraucherschlichtungsstelle teilzunehmen (§ 36
        Verbraucherstreitbeilegungsgesetz).
      </p>
      <p className="text-sm text-neutral-600">
        Ein Hinweis auf die Online-Streitbeilegungsplattform der Europäischen
        Kommission entfällt bewusst: Die Plattform hat ihren Betrieb am
        20. Juli 2025 eingestellt. Ein Link darauf wäre heute ein toter Verweis.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Meldungen nach dem DSA</h2>
      <p className="text-neutral-800">
        Rechtswidrige Inhalte können jederzeit über unser{" "}
        <a href="/abuse" className="underline">
          Meldeformular nach Art. 16 DSA
        </a>{" "}
        gemeldet werden. Für Mitteilungen von Behörden und für sonstige Anliegen
        im Zusammenhang mit dem Digital Services Act ist die oben genannte
        E-Mail-Adresse die zentrale Kontaktstelle nach Art. 11 und Art. 12 DSA.
        Die Kommunikationssprache ist Deutsch.
      </p>
    </>
  );
}
