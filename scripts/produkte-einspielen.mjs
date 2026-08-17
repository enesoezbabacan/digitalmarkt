/**
 * Spielt die vorbereiteten Produkte aus ~/digitalmarkt/produkte/ in die
 * Datenbank ein und lädt die Dateien in den privaten Storage-Bucket.
 *
 *   node scripts/produkte-einspielen.mjs --verkaeufer <UUID>   # einspielen
 *   node scripts/produkte-einspielen.mjs --liste               # Verkäufer zeigen
 *
 * Warum service_role: Es ist kein Nutzer angemeldet, und die Produkte werden
 * im Namen eines bestehenden Verkäufers angelegt. Row Level Security würde das
 * zu Recht blockieren.
 *
 * Das Skript ist wiederholbar: Ein Produkt mit gleichem Titel beim selben
 * Verkäufer wird aktualisiert statt ein zweites Mal angelegt.
 */
import { createClient } from "@supabase/supabase-js";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const PRODUKT_ORDNER = path.join(process.cwd(), "produkte");
const TEXTE = path.join(PRODUKT_ORDNER, "verkaufstexte.json");

async function envLaden() {
  const roh = await readFile(path.join(process.cwd(), ".env.local"), "utf8");
  return Object.fromEntries(
    roh
      .split("\n")
      .filter((z) => z.includes("=") && !z.trim().startsWith("#"))
      .map((z) => [z.slice(0, z.indexOf("=")), z.slice(z.indexOf("=") + 1).trim()]),
  );
}

/** "24,90" -> 2490. Gleiche Regel wie in src/lib/geld.ts. */
function euroZuCent(text) {
  const bereinigt = text.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(bereinigt)) return null;
  const [ganz, bruch = ""] = bereinigt.split(".");
  return Number(ganz) * 100 + Number(bruch.padEnd(2, "0"));
}

const TYPEN = {
  ".pdf": "application/pdf",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".zip": "application/zip",
};

async function main() {
  const env = await envLaden();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const schluessel = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !schluessel) {
    console.error("NEXT_PUBLIC_SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY fehlt in .env.local.");
    process.exit(1);
  }

  const db = createClient(url, schluessel, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const args = process.argv.slice(2);

  if (args.includes("--liste") || args.length === 0) {
    const { data, error } = await db
      .from("sellers")
      .select("id, name, email, status, stripe_account_id")
      .order("created_at");

    if (error) {
      console.error("Verkäufer konnten nicht geladen werden:", error.message);
      process.exit(1);
    }

    console.log("\nVorhandene Verkäufer:\n");
    for (const v of data ?? []) {
      const stripe = v.stripe_account_id ? "Stripe verbunden" : "kein Stripe";
      console.log(`  ${v.id}`);
      console.log(`    ${v.name}  <${v.email}>  [${v.status}, ${stripe}]\n`);
    }
    console.log("Einspielen mit:");
    console.log("  node scripts/produkte-einspielen.mjs --verkaeufer <UUID>\n");
    return;
  }

  const i = args.indexOf("--verkaeufer");
  const verkaeuferId = i >= 0 ? args[i + 1] : null;
  if (!verkaeuferId) {
    console.error("Bitte --verkaeufer <UUID> angeben. Verfügbare IDs mit --liste.");
    process.exit(1);
  }

  const { data: verkaeufer, error: vFehler } = await db
    .from("sellers")
    .select("id, name")
    .eq("id", verkaeuferId)
    .maybeSingle();

  if (vFehler || !verkaeufer) {
    console.error("Verkäufer nicht gefunden. Verfügbare IDs mit --liste.");
    process.exit(1);
  }

  const { produkte } = JSON.parse(await readFile(TEXTE, "utf8"));
  const vorhandeneDateien = new Set(await readdir(PRODUKT_ORDNER));

  console.log(`\nSpiele ${produkte.length} Produkte für "${verkaeufer.name}" ein.\n`);

  let angelegt = 0;
  let aktualisiert = 0;

  for (const p of produkte) {
    if (!vorhandeneDateien.has(p.datei)) {
      console.error(`  FEHLT: ${p.datei} — übersprungen`);
      continue;
    }

    const preisCent = euroZuCent(p.preis);
    if (preisCent === null) {
      console.error(`  UNGÜLTIGER PREIS bei ${p.titel}: ${p.preis} — übersprungen`);
      continue;
    }

    const inhalt = await readFile(path.join(PRODUKT_ORDNER, p.datei));

    // Gibt es das Produkt schon? Dann aktualisieren statt doppelt anlegen.
    const { data: bestehend } = await db
      .from("products")
      .select("id")
      .eq("seller_id", verkaeuferId)
      .eq("titel", p.titel)
      .maybeSingle();

    let produktId = bestehend?.id;

    if (produktId) {
      const { error } = await db
        .from("products")
        .update({
          beschreibung: p.beschreibung,
          kategorie: p.kategorie,
          preis_cent: preisCent,
        })
        .eq("id", produktId);
      if (error) {
        console.error(`  FEHLER bei ${p.titel}: ${error.message}`);
        continue;
      }
      aktualisiert++;
    } else {
      const { data, error } = await db
        .from("products")
        .insert({
          seller_id: verkaeuferId,
          titel: p.titel,
          beschreibung: p.beschreibung,
          kategorie: p.kategorie,
          preis_cent: preisCent,
          waehrung: "EUR",
          status: "draft",
        })
        .select("id")
        .single();
      if (error) {
        console.error(`  FEHLER bei ${p.titel}: ${error.message}`);
        continue;
      }
      produktId = data.id;
      angelegt++;
    }

    // Datei in den privaten Bucket. Der erste Ordner MUSS die Verkäufer-ID
    // sein — darauf prüft die Storage-Policy aus Migration 0002.
    const endung = path.extname(p.datei).toLowerCase();
    const pfad = `${verkaeuferId}/${produktId}${endung}`;

    const { error: uploadFehler } = await db.storage
      .from("produktdateien")
      .upload(pfad, inhalt, {
        upsert: true,
        contentType: TYPEN[endung] ?? "application/octet-stream",
      });

    if (uploadFehler) {
      console.error(`  UPLOAD-FEHLER bei ${p.titel}: ${uploadFehler.message}`);
      continue;
    }

    await db
      .from("products")
      .update({
        datei_pfad: pfad,
        datei_name: p.datei,
        datei_groesse: inhalt.length,
      })
      .eq("id", produktId);

    const euro = (preisCent / 100).toFixed(2).replace(".", ",");
    console.log(`  ${euro.padStart(6)} €  ${p.titel}`);
  }

  console.log(`\n${angelegt} neu angelegt, ${aktualisiert} aktualisiert.`);
  console.log("Alle Produkte stehen auf 'draft' und sind noch nicht im Katalog.");
  console.log("Freigeben im Admin-Bereich oder mit: node scripts/freigeben.mjs alle\n");
}

main().catch((fehler) => {
  console.error("Abbruch:", fehler.message);
  process.exit(1);
});
