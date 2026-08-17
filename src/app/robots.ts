import type { MetadataRoute } from "next";

import { absolut, GESPERRTE_PFADE, suchmaschinenErlaubt } from "@/lib/seo";

/**
 * robots.txt — erzeugt unter /robots.txt.
 *
 * Solange die Seite nicht freigegeben ist (siehe SUCHMASCHINEN in
 * src/lib/seo.ts), steht hier ein vollständiges Verbot. Danach nur noch die
 * persönlichen und token-behafteten Bereiche.
 */
export default function robots(): MetadataRoute.Robots {
  if (!suchmaschinenErlaubt()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Ohne Schrägstrich am Ende: "/admin" sperrt sowohl /admin selbst als
      // auch alles darunter. Mit Schrägstrich bliebe /admin offen.
      disallow: GESPERRTE_PFADE,
    },
    sitemap: absolut("/sitemap.xml"),
  };
}
