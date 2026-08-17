/**
 * Freischalten von Produkten in den LOKALEN Testdaten (DATENQUELLE=lokal).
 *
 * Für den echten Betrieb gibt es den Betreiber-Bereich unter /admin; dieses
 * Skript kommt an Supabase gar nicht heran. Es bleibt nur für die Entwicklung
 * ohne Datenbank erhalten.
 *
 *   node scripts/freigeben.mjs              # zeigt alle Produkte
 *   node scripts/freigeben.mjs alle         # schaltet alle frei
 *   node scripts/freigeben.mjs <produkt-id> # schaltet eines frei
 *   node scripts/freigeben.mjs sperren <id> # nimmt eines offline
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const datei = path.join(process.cwd(), ".lokale-daten", "daten.json");

let daten;
try {
  daten = JSON.parse(await readFile(datei, "utf8"));
} catch {
  console.error(
    "Keine lokalen Daten gefunden. Lege zuerst über den Verkäufer-Bereich ein Produkt an.",
  );
  process.exit(1);
}

const [befehl, zweites] = process.argv.slice(2);

function zeigen() {
  if (daten.produkte.length === 0) {
    console.log("Noch keine Produkte vorhanden.");
    return;
  }
  for (const p of daten.produkte) {
    const preis = (p.preis_cent / 100).toFixed(2).replace(".", ",");
    console.log(`${p.status.padEnd(7)} ${preis.padStart(8)} €  ${p.titel}`);
    console.log(`        id: ${p.id}`);
  }
}

function setzen(pruefung, status) {
  const betroffen = daten.produkte.filter(pruefung);
  if (betroffen.length === 0) {
    console.error("Kein passendes Produkt gefunden.");
    process.exit(1);
  }
  for (const p of betroffen) {
    if (status === "live" && !p.datei_pfad) {
      console.error(`Übersprungen (keine Datei hinterlegt): ${p.titel}`);
      continue;
    }
    p.status = status;
    console.log(`${status === "live" ? "Freigegeben" : "Gesperrt"}: ${p.titel}`);
  }
}

if (!befehl) {
  zeigen();
} else if (befehl === "alle") {
  setzen(() => true, "live");
  await writeFile(datei, JSON.stringify(daten, null, 2));
} else if (befehl === "sperren") {
  setzen((p) => p.id === zweites, "removed");
  await writeFile(datei, JSON.stringify(daten, null, 2));
} else {
  setzen((p) => p.id === befehl, "live");
  await writeFile(datei, JSON.stringify(daten, null, 2));
}
