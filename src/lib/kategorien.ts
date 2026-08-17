/**
 * Zulässige Produktkategorien.
 *
 * Bewusst eine eigene Datei: Dateien mit "use server" dürfen ausschließlich
 * asynchrone Funktionen exportieren, keine Konstanten.
 */
export const KATEGORIEN = [
  "E-Book",
  "Vorlage",
  "Preset",
  "Kurs",
  "Grafik",
  "Audio",
  "Software",
] as const;

export type Kategorie = (typeof KATEGORIEN)[number];
