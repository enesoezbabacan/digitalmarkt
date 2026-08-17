import type { MetadataRoute } from "next";

import { db } from "@/lib/db";
import { absolut, suchmaschinenErlaubt } from "@/lib/seo";

/**
 * sitemap.xml — erzeugt unter /sitemap.xml.
 *
 * Enthält nur, was auch öffentlich ist: den Katalog, die Rechtstexte, die
 * Verkäufer-Anmeldung und jedes freigegebene Produkt. db().katalog() liefert
 * ausschließlich Produkte mit status = 'live', Entwürfe und gesperrte
 * Produkte tauchen dadurch gar nicht erst auf.
 */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Ist die Seite gesperrt, wäre eine gefüllte sitemap.xml ein Widerspruch
  // zur robots.txt — und eine offene Liste aller Produktadressen.
  if (!suchmaschinenErlaubt()) return [];

  const feste: MetadataRoute.Sitemap = [
    { url: absolut("/"), changeFrequency: "daily", priority: 1 },
    { url: absolut("/automaten"), changeFrequency: "monthly", priority: 0.9 },
    { url: absolut("/registrieren"), changeFrequency: "monthly", priority: 0.6 },
    { url: absolut("/impressum"), changeFrequency: "yearly", priority: 0.2 },
    { url: absolut("/datenschutz"), changeFrequency: "yearly", priority: 0.2 },
    { url: absolut("/agb"), changeFrequency: "yearly", priority: 0.2 },
    { url: absolut("/verkaeufervertrag"), changeFrequency: "yearly", priority: 0.2 },
    { url: absolut("/widerruf"), changeFrequency: "yearly", priority: 0.2 },
    { url: absolut("/abuse"), changeFrequency: "yearly", priority: 0.2 },
  ];

  // Fällt die Datenbank aus, soll die sitemap.xml trotzdem ausgeliefert
  // werden — eine verkürzte Liste ist besser als ein Serverfehler, den
  // Suchmaschinen sich merken.
  let produkte: Awaited<ReturnType<ReturnType<typeof db>["katalog"]>> = [];
  try {
    produkte = await db().katalog();
  } catch {
    return feste;
  }

  return [
    ...feste,
    ...produkte.map((produkt) => ({
      url: absolut(`/produkt/${produkt.id}`),
      lastModified: new Date(produkt.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
