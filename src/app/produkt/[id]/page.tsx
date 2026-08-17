import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { formatEuro } from "@/lib/geld";
import { ABSETZBAR_HINWEIS, preisHinweisLang } from "@/lib/preis-hinweis";
import { absolut, suchmaschinenErlaubt } from "@/lib/seo";
import { LAENDER_NAMEN } from "@/lib/validation/verkaeufer";
import { KaufFormular } from "./kauf-formular";
import { verkaeuferKannZahlungenEmpfangen } from "./verkaeufer-bereit";

/** Erster Teil der Beschreibung, auf Suchergebnis-Länge gekürzt. */
function kurzfassung(text: string, zeichen = 155): string {
  const eine = text.replace(/\s+/g, " ").trim();
  if (eine.length <= zeichen) return eine;
  const gekuerzt = eine.slice(0, zeichen);
  const luecke = gekuerzt.lastIndexOf(" ");
  return `${(luecke > 40 ? gekuerzt.slice(0, luecke) : gekuerzt).trimEnd()}…`;
}

/**
 * Titel und Beschreibung für Suchergebnisse und geteilte Links.
 *
 * Next.js ruft diese Funktion zusätzlich zur Seite auf. Der Datenbankzugriff
 * doppelt sich dadurch nicht: Innerhalb eines Renderdurchlaufs wird dieselbe
 * Anfrage nur einmal ausgeführt.
 */
export async function generateMetadata({
  params,
}: PageProps<"/produkt/[id]">): Promise<Metadata> {
  const { id } = await params;
  const produkt = await db().produktOeffentlich(id);
  if (!produkt) return { title: "Produkt nicht gefunden" };

  const beschreibung = kurzfassung(produkt.beschreibung);
  const url = absolut(`/produkt/${produkt.id}`);

  return {
    title: produkt.titel,
    description: beschreibung,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "de_DE",
      url,
      title: produkt.titel,
      description: beschreibung,
    },
  };
}

export default async function Produktseite({ params }: PageProps<"/produkt/[id]">) {
  const { id } = await params;
  const produkt = await db().produktOeffentlich(id);

  // produktOeffentlich liefert nur Produkte mit status = 'live'.
  // Entwürfe und gesperrte Produkte sind dadurch auch bei bekannter ID unsichtbar.
  if (!produkt) notFound();

  const verkaeuferBereit = await verkaeuferKannZahlungenEmpfangen(
    produkt.seller_id,
  );

  /**
   * Strukturierte Daten für Google (schema.org/Product).
   *
   * Damit kann Google Preis und Anbieter direkt im Suchergebnis anzeigen,
   * statt nur einen Textausschnitt. Es steht ausschließlich drin, was auch
   * auf der Seite steht — erfundene Angaben wie Bewertungen oder
   * Lieferzeiten führen zum Ausschluss aus den Suchergebnissen.
   */
  const strukturierteDaten = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: produkt.titel,
    description: kurzfassung(produkt.beschreibung, 500),
    category: produkt.kategorie,
    url: absolut(`/produkt/${produkt.id}`),
    offers: {
      "@type": "Offer",
      price: (produkt.preis_cent / 100).toFixed(2),
      priceCurrency: produkt.waehrung.toUpperCase(),
      // Digitale Ware ist nie ausverkauft — sie ist nur dann nicht käuflich,
      // wenn der Verkäufer keine Zahlungen empfangen kann.
      availability: verkaeuferBereit
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: absolut(`/produkt/${produkt.id}`),
      seller: { "@type": "Organization", name: produkt.verkaeufer.name },
    },
  };

  return (
    <article className="grid gap-10 lg:grid-cols-[1fr_20rem]">
      {suchmaschinenErlaubt() && (
        <script
          type="application/ld+json"
          // Inhalt stammt aus JSON.stringify, nicht aus einer Zeichenkette
          // mit Nutzereingaben — dadurch sind Anführungszeichen und
          // Sonderzeichen bereits maskiert.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(strukturierteDaten).replace(/</g, "\\u003c"),
          }}
        />
      )}

      <div>
        <Link href="/" className="text-sm text-neutral-600 hover:underline">
          ← Zurück zum Katalog
        </Link>

        <span className="mt-4 block text-xs font-medium tracking-wide text-neutral-500 uppercase">
          {produkt.kategorie}
        </span>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          {produkt.titel}
        </h1>

        <div className="mt-6 whitespace-pre-line text-neutral-700">
          {produkt.beschreibung}
        </div>
      </div>

      <aside className="h-fit rounded-lg border border-neutral-200 p-5">
        <p className="text-2xl font-semibold">{formatEuro(produkt.preis_cent)}</p>
        <p className="mt-1 text-xs text-neutral-500">
          {preisHinweisLang(produkt.verkaeufer.kleinunternehmer)}
        </p>
        <p className="mt-2 text-xs text-neutral-600">{ABSETZBAR_HINWEIS}</p>

        <KaufFormular
          produktId={produkt.id}
          verkaeuferBereit={verkaeuferBereit}
        />

        <dl className="mt-6 space-y-2 border-t border-neutral-200 pt-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Anbieter</dt>
            <dd className="text-right font-medium">{produkt.verkaeufer.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Sitz</dt>
            <dd className="text-right">
              {produkt.verkaeufer.ort},{" "}
              {LAENDER_NAMEN[produkt.verkaeufer.land] ?? produkt.verkaeufer.land}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-500">Lieferung</dt>
            <dd className="text-right">Sofortiger Download</dd>
          </div>
        </dl>

        <p className="mt-5 text-xs text-neutral-500">
          Dieses Produkt wird von einem unabhängigen Verkäufer angeboten. Du
          schließt den Vertrag mit ihm, nicht mit dem Marktplatz.{" "}
          <Link href={`/abuse?produkt=${produkt.id}`} className="underline">
            Rechtsverletzung melden
          </Link>
        </p>
      </aside>
    </article>
  );
}
