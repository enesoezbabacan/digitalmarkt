import { supabaseServer } from "@/lib/supabase/server";
import { BEDINGUNGEN_FASSUNG } from "@/lib/bedingungen";

import type {
  Bestellung,
  Datenschicht,
  NeuerVerkaeufer,
  NeuesProdukt,
  Produkt,
  ProduktMitVerkaeufer,
  ProduktStatus,
  Verkaeufer,
} from "./typen";

/**
 * Datenschicht gegen Supabase.
 *
 * Der wichtige Unterschied zur lokalen Variante: Die Trennung zwischen
 * Verkäufern wird hier von der DATENBANK erzwungen (Row Level Security), nicht
 * vom Anwendungscode. Die zusätzlichen `.eq("seller_id", …)`-Filter unten sind
 * trotzdem drin — doppelt hält besser, und sie machen im Code sichtbar, was
 * gemeint ist.
 *
 * Anmeldung läuft über Supabase Auth. Weil neue Projekte standardmäßig eine
 * E-Mail-Bestätigung verlangen, kann die Verkäuferzeile beim Registrieren noch
 * nicht angelegt werden — zu dem Zeitpunkt gibt es keine Sitzung. Die Daten
 * werden deshalb am Auth-Konto hinterlegt und bei der ersten angemeldeten
 * Anfrage in die Tabelle übernommen (siehe `zeileSicherstellen`).
 */

const VERKAEUFER_SPALTEN =
  "id,name,email,telefon,strasse,plz,ort,land,steuernummer,ust_id," +
  "ust_id_pruefergebnis,ust_id_geprueft_at,stripe_account_id,status," +
  "kleinunternehmer," +
  "rechte_bestaetigt_at,bedingungen_akzeptiert_at,bedingungen_fassung," +
  "created_at";

const PRODUKT_SPALTEN =
  "id,seller_id,titel,beschreibung,kategorie,preis_cent,waehrung," +
  "datei_pfad,datei_name,datei_groesse,vorschau_bild,status,created_at";

type Stammdaten = Omit<NeuerVerkaeufer, "email">;

/** Adresse, unter der die Seite läuft — Ziel für Links aus Supabase-Mails. */
function seitenAdresse(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/+$/,
    "",
  );
}

export class SupabaseDatenschicht implements Datenschicht {
  // --- Katalog (öffentlich) ------------------------------------------------

  async katalog(filter?: { suche?: string; kategorie?: string }) {
    const sb = await supabaseServer();

    let abfrage = sb
      .from("products")
      .select(PRODUKT_SPALTEN)
      .eq("status", "live")
      .order("created_at", { ascending: false });

    if (filter?.kategorie) abfrage = abfrage.eq("kategorie", filter.kategorie);

    if (filter?.suche?.trim()) {
      // Sonderzeichen entschärfen, damit die Suche keine Filtersyntax auslöst.
      const begriff = filter.suche.trim().replace(/[%,()]/g, " ");
      abfrage = abfrage.or(
        `titel.ilike.%${begriff}%,beschreibung.ilike.%${begriff}%`,
      );
    }

    const { data, error } = await abfrage;
    if (error) {
      throw new Error(`Katalog konnte nicht geladen werden: ${error.message}`);
    }

    const produkte = (data ?? []) as unknown as Produkt[];
    const verkaeufer = await oeffentlicheVerkaeufer(
      produkte.map((p) => p.seller_id),
    );

    return produkte.flatMap<ProduktMitVerkaeufer>((p) => {
      const v = verkaeufer.get(p.seller_id);
      return v ? [{ ...p, verkaeufer: v }] : [];
    });
  }

  async produktOeffentlich(id: string) {
    const sb = await supabaseServer();

    const { data, error } = await sb
      .from("products")
      .select(PRODUKT_SPALTEN)
      .eq("id", id)
      .eq("status", "live")
      .maybeSingle();

    if (error || !data) return null;

    const produkt = data as unknown as Produkt;
    const verkaeufer = await oeffentlicheVerkaeufer([produkt.seller_id]);
    const v = verkaeufer.get(produkt.seller_id);

    return v ? { ...produkt, verkaeufer: v } : null;
  }

  async kategorien() {
    const sb = await supabaseServer();
    const { data } = await sb
      .from("products")
      .select("kategorie")
      .eq("status", "live");
    return [...new Set((data ?? []).map((z) => z.kategorie as string))].sort();
  }

  // --- Verkäufer -----------------------------------------------------------

  async verkaeuferAnlegen(daten: NeuerVerkaeufer, passwort: string) {
    const sb = await supabaseServer();
    const { email, ...stammdaten } = daten;

    const { data, error } = await sb.auth.signUp({
      email,
      password: passwort,
      options: {
        // Die Stammdaten reisen am Auth-Konto mit, bis eine Sitzung besteht.
        data: { stammdaten },
        // Ziel des Links in der Bestätigungsmail.
        emailRedirectTo: `${seitenAdresse()}/auth/callback`,
      },
    });

    if (error) {
      if (/already registered|already been registered/i.test(error.message)) {
        return { fehler: "Für diese E-Mail-Adresse gibt es bereits ein Konto." };
      }
      if (/password/i.test(error.message)) {
        return {
          fehler: "Das Passwort ist zu schwach. Nimm mindestens 10 Zeichen.",
        };
      }
      return { fehler: `Registrierung fehlgeschlagen: ${error.message}` };
    }

    if (!data.user) {
      return { fehler: "Registrierung fehlgeschlagen. Bitte versuche es erneut." };
    }

    // Nur wenn Supabase direkt eine Sitzung liefert (E-Mail-Bestätigung aus),
    // lässt sich die Zeile sofort anlegen. Sonst passiert das beim ersten Login.
    if (data.session) {
      await zeileAnlegen(data.user.id, email, stammdaten);
    }

    return { id: data.user.id };
  }

  async verkaeuferPerLogin(email: string, passwort: string) {
    const sb = await supabaseServer();

    const { data, error } = await sb.auth.signInWithPassword({
      email,
      password: passwort,
    });

    if (error || !data.user) return null;
    return zeileSicherstellen(data.user.id);
  }

  async verkaeufer(id: string) {
    const sb = await supabaseServer();

    const { data } = await sb
      .from("sellers")
      .select(VERKAEUFER_SPALTEN)
      .eq("id", id)
      .maybeSingle();

    if (data) return data as unknown as Verkaeufer;

    // Erste Anfrage nach bestätigter E-Mail: Zeile aus den Anmeldedaten anlegen.
    return zeileSicherstellen(id);
  }

  async ustPruefungSpeichern(id: string, ergebnis: string, geprueftAm: string) {
    const sb = await supabaseServer();
    await sb
      .from("sellers")
      .update({ ust_id_pruefergebnis: ergebnis, ust_id_geprueft_at: geprueftAm })
      .eq("id", id);
  }

  // --- Produkte des angemeldeten Verkäufers --------------------------------

  async eigeneProdukte(sellerId: string) {
    const sb = await supabaseServer();

    const { data, error } = await sb
      .from("products")
      .select(PRODUKT_SPALTEN)
      .eq("seller_id", sellerId)
      .neq("status", "removed")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Produkte konnten nicht geladen werden: ${error.message}`);
    }
    return (data ?? []) as unknown as Produkt[];
  }

  async produktAnlegen(sellerId: string, daten: NeuesProdukt) {
    const sb = await supabaseServer();

    const { data, error } = await sb
      .from("products")
      .insert({ ...daten, seller_id: sellerId, waehrung: "EUR", status: "draft" })
      .select(PRODUKT_SPALTEN)
      .single();

    if (error) {
      throw new Error(`Produkt konnte nicht angelegt werden: ${error.message}`);
    }
    return data as unknown as Produkt;
  }

  async produktAktualisieren(
    sellerId: string,
    produktId: string,
    daten: Partial<NeuesProdukt> & { status?: ProduktStatus },
  ) {
    const sb = await supabaseServer();

    const { data } = await sb
      .from("products")
      .update(daten)
      .eq("id", produktId)
      .eq("seller_id", sellerId)
      .select(PRODUKT_SPALTEN)
      .maybeSingle();

    return (data as unknown as Produkt) ?? null;
  }

  async produktDateiSpeichern(
    sellerId: string,
    produktId: string,
    datei: { name: string; groesse: number; inhalt: Uint8Array },
  ) {
    const sb = await supabaseServer();

    // Dateiname niemals vom Nutzer übernehmen. Der erste Ordner MUSS die
    // Verkäufer-ID sein — genau darauf prüft die Storage-Policy.
    const endung = (datei.name.match(/\.[A-Za-z0-9]{1,10}$/)?.[0] ?? "").toLowerCase();
    const pfad = `${sellerId}/${produktId}${endung}`;

    const { error: uploadFehler } = await sb.storage
      .from("produktdateien")
      .upload(pfad, datei.inhalt, {
        upsert: true,
        contentType: "application/octet-stream",
      });

    if (uploadFehler) {
      return {
        fehler: `Datei konnte nicht gespeichert werden: ${uploadFehler.message}`,
      };
    }

    const { data } = await sb
      .from("products")
      .update({
        datei_pfad: pfad,
        datei_name: datei.name,
        datei_groesse: datei.groesse,
      })
      .eq("id", produktId)
      .eq("seller_id", sellerId)
      .select("id")
      .maybeSingle();

    if (!data) return { fehler: "Produkt nicht gefunden." };
    return { pfad };
  }

  // --- Bestellungen --------------------------------------------------------

  async eigeneBestellungen(sellerId: string) {
    const sb = await supabaseServer();

    const { data } = await sb
      .from("orders")
      .select("*")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });

    return (data ?? []) as unknown as Bestellung[];
  }
}

// --- Hilfsfunktionen -------------------------------------------------------

/**
 * Lädt die öffentlich zeigbaren Verkäuferangaben zu mehreren IDs.
 *
 * Bewusst über die View `sellers_public` und nicht über einen eingebetteten
 * Join auf `sellers`: Nicht angemeldete Besucher haben auf `sellers` keinerlei
 * Rechte — und das soll auch so bleiben, weil dort Anschriften und
 * Steuernummern liegen. Die View gibt nur id, name, ort und land heraus.
 */
async function oeffentlicheVerkaeufer(
  ids: string[],
): Promise<Map<string, ProduktMitVerkaeufer["verkaeufer"]>> {
  const eindeutig = [...new Set(ids)];
  if (eindeutig.length === 0) return new Map();

  const sb = await supabaseServer();
  const { data, error } = await sb
    .from("sellers_public")
    .select("id,name,ort,land,kleinunternehmer")
    .in("id", eindeutig);

  // Bewusst werfen statt still eine leere Liste zurückgeben: Ohne die
  // Verkäuferangaben fällt jedes Produkt aus dem Katalog, und der Shop wäre
  // scheinbar leer — ohne dass irgendwo ein Fehler auftaucht. Eine sichtbare
  // Fehlerseite ist deutlich besser als ein unbemerkt leerer Laden.
  if (error) {
    throw new Error(
      `Verkäuferangaben konnten nicht geladen werden: ${error.message}`,
    );
  }

  return new Map(
    (data ?? []).map((v) => [
      v.id as string,
      v as ProduktMitVerkaeufer["verkaeufer"],
    ]),
  );
}

async function zeileAnlegen(
  id: string,
  email: string,
  stammdaten: Stammdaten,
): Promise<Verkaeufer | null> {
  const sb = await supabaseServer();

  const { data } = await sb
    .from("sellers")
    .insert({
      ...stammdaten,
      id,
      email,
      rechte_bestaetigt_at: new Date().toISOString(),
      bedingungen_akzeptiert_at: new Date().toISOString(),
      bedingungen_fassung: BEDINGUNGEN_FASSUNG,
    })
    .select(VERKAEUFER_SPALTEN)
    .maybeSingle();

  return (data as unknown as Verkaeufer) ?? null;
}

/**
 * Liefert die Verkäuferzeile und legt sie an, falls sie noch fehlt.
 *
 * Nötig, weil zwischen Registrierung und erster Anmeldung die
 * E-Mail-Bestätigung liegt: Vorher gibt es keine Sitzung, und ohne Sitzung
 * lässt RLS kein Einfügen zu.
 */
async function zeileSicherstellen(id: string): Promise<Verkaeufer | null> {
  const sb = await supabaseServer();

  const { data: vorhanden } = await sb
    .from("sellers")
    .select(VERKAEUFER_SPALTEN)
    .eq("id", id)
    .maybeSingle();

  if (vorhanden) return vorhanden as unknown as Verkaeufer;

  const { data: konto } = await sb.auth.getUser();
  const stammdaten = konto.user?.user_metadata?.stammdaten as
    | Stammdaten
    | undefined;

  if (!konto.user || !stammdaten) return null;

  return zeileAnlegen(id, konto.user.email ?? "", stammdaten);
}
