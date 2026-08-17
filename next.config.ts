import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * pdfkit lädt seine Schriftmetriken (.afm) zur Laufzeit als Dateien aus dem
   * eigenen Paketordner. Wird das Paket mitgebündelt, zeigt dieser Pfad ins
   * Leere — die Rechnung scheitert dann mit
   * "ENOENT: … /ROOT/node_modules/pdfkit/js/data/Helvetica.afm".
   *
   * serverExternalPackages lässt das Paket unangetastet, sodass es seine
   * Dateien wie gewohnt findet.
   */
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
