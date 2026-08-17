/**
 * CSV-Erzeugung für den Steuerberater.
 *
 * Zwei Eigenheiten, die hier nicht verhandelbar sind:
 *
 * 1. **Semikolon als Trennzeichen.** Deutsches Excel erwartet das. Mit Komma
 *    landet die ganze Zeile in einer einzigen Spalte, und der Steuerberater
 *    schickt die Datei zurück.
 *
 * 2. **BOM am Dateianfang.** Ohne diese drei Bytes liest Excel die Datei nicht
 *    als UTF-8 — aus "Özbabacan" wird "Ã–zbabacan" und aus dem Eurozeichen
 *    Kauderwelsch.
 *
 * Beträge werden mit Komma als Dezimaltrennzeichen ausgegeben, ebenfalls
 * damit deutsches Excel sie als Zahl erkennt und nicht als Text.
 */

const BOM = "﻿";

/** Maskiert einen Wert für CSV. */
function feld(wert: unknown): string {
  if (wert === null || wert === undefined) return "";
  const text = String(wert);

  // Formelanfänge entschärfen: Ein Feld, das mit = + - @ beginnt, wird von
  // Excel als Formel ausgeführt. Bei Daten aus Nutzereingaben — etwa einem
  // Produkttitel — ist das ein bekannter Angriffsweg (CSV Injection).
  const entschaerft = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;

  if (/[";\n\r]/.test(entschaerft)) {
    return `"${entschaerft.replace(/"/g, '""')}"`;
  }
  return entschaerft;
}

/** Cent als deutscher Dezimalwert ohne Währungszeichen, z. B. 1290 -> "12,90". */
export function centFuerCsv(cent: number): string {
  return (cent / 100).toFixed(2).replace(".", ",");
}

export function csvErzeugen(
  kopf: string[],
  zeilen: Array<Array<unknown>>,
): string {
  const inhalt = [kopf, ...zeilen]
    .map((zeile) => zeile.map(feld).join(";"))
    .join("\r\n");

  return BOM + inhalt + "\r\n";
}
