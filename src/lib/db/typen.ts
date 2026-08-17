/**
 * Datenmodell des Marktplatzes.
 *
 * Diese Typen sind die einzige Wahrheit für beide Implementierungen der
 * Datenschicht (lokal und Supabase) und entsprechen 1:1 der SQL-Migration
 * in supabase/migrations/0001_init.sql.
 *
 * Alle Geldbeträge sind ganzzahlige Cent — siehe src/lib/geld.ts.
 */

export type VerkaeuferStatus = "pending" | "active" | "suspended";
export type ProduktStatus = "draft" | "review" | "live" | "removed";
export type BestellStatus = "bezahlt" | "erstattet" | "storniert";
export type MeldungStatus = "offen" | "geprueft" | "erledigt" | "abgelehnt";

export type Verkaeufer = {
  id: string;
  name: string;
  email: string;
  telefon: string;
  strasse: string;
  plz: string;
  ort: string;
  land: string;
  steuernummer: string;
  ust_id: string | null;
  /** Ergebnis der VIES-Prüfung: gueltig | ungueltig | unbekannt */
  ust_id_pruefergebnis: string | null;
  ust_id_geprueft_at: string | null;
  /** Wird ausschließlich serverseitig gesetzt, nie vom Verkäufer selbst. */
  stripe_account_id: string | null;
  /** § 19 UStG: keine Umsatzsteuer im Preis enthalten. */
  kleinunternehmer: boolean;
  status: VerkaeuferStatus;
  /** Bestätigung der Rechteinhaberschaft an den eingestellten Inhalten. */
  rechte_bestaetigt_at: string | null;
  /**
   * Zustimmung zu AGB und Verkäufervertrag. `null` heißt: nicht zugestimmt —
   * das gilt auch für Verkäufer, die sich vor Einführung der Zustimmung
   * registriert haben. Ein erfundener Wert wäre eine falsche Beweisurkunde.
   */
  bedingungen_akzeptiert_at: string | null;
  /** Fassung der Texte, der zugestimmt wurde, z. B. "2026-08". */
  bedingungen_fassung: string | null;
  created_at: string;
};

export type Produkt = {
  id: string;
  seller_id: string;
  titel: string;
  beschreibung: string;
  kategorie: string;
  preis_cent: number;
  waehrung: string;
  datei_pfad: string | null;
  datei_name: string | null;
  datei_groesse: number | null;
  vorschau_bild: string | null;
  status: ProduktStatus;
  created_at: string;
};

export type Bestellung = {
  id: string;
  product_id: string;
  seller_id: string;
  kaeufer_email: string;
  betrag_cent: number;
  provision_cent: number;
  stripe_payment_intent: string | null;
  kaeufer_land: string | null;
  /**
   * Zwei unabhängige Nachweise zum Standort des Käufers (Rechnungsland und
   * IP-Land) — Nachweispflicht bei digitalen Leistungen in der EU.
   */
  kaeufer_land_nachweis: Record<string, unknown> | null;
  download_token: string | null;
  token_ablauf: string | null;
  download_zaehler: number;
  /**
   * Zeitpunkt, zu dem der Käufer dem sofortigen Download zugestimmt und
   * damit auf sein Widerrufsrecht verzichtet hat (§ 356 Abs. 5 BGB).
   * Ohne diesen Eintrag bleibt das Widerrufsrecht 14 Tage bestehen.
   */
  widerruf_verzicht_at: string | null;
  status: BestellStatus;
  created_at: string;
};

export type Meldung = {
  id: string;
  product_id: string;
  melder_email: string;
  melder_name: string | null;
  grund: string;
  status: MeldungStatus;
  notizen: string | null;
  created_at: string;
  erledigt_at: string | null;
};

/** Produkt mit den öffentlich zeigbaren Verkäuferangaben. */
export type ProduktMitVerkaeufer = Produkt & {
  verkaeufer: Pick<Verkaeufer, "id" | "name" | "ort" | "land"> & {
    /**
     * true = Verkäufer ist Kleinunternehmer nach § 19 UStG und weist keine
     * Umsatzsteuer aus. Steuert den Hinweis unter dem Preis.
     */
    kleinunternehmer: boolean;
  };
};

export type NeuerVerkaeufer = Omit<
  Verkaeufer,
  | "id"
  | "created_at"
  | "status"
  | "stripe_account_id"
  | "ust_id_pruefergebnis"
  | "ust_id_geprueft_at"
  | "rechte_bestaetigt_at"
  | "bedingungen_akzeptiert_at"
  | "bedingungen_fassung"
>;

export type NeuesProdukt = Pick<
  Produkt,
  "titel" | "beschreibung" | "kategorie" | "preis_cent"
>;

/**
 * Vertrag der Datenschicht. Beide Implementierungen erfüllen ihn identisch,
 * damit der Wechsel von lokalen Testdaten auf Supabase eine Konfigurations-
 * änderung ist und kein Umbau.
 */
export interface Datenschicht {
  // Katalog (öffentlich, nur status = 'live')
  katalog(filter?: {
    suche?: string;
    kategorie?: string;
  }): Promise<ProduktMitVerkaeufer[]>;
  produktOeffentlich(id: string): Promise<ProduktMitVerkaeufer | null>;
  kategorien(): Promise<string[]>;

  // Verkäufer
  verkaeuferAnlegen(
    daten: NeuerVerkaeufer,
    passwort: string,
  ): Promise<{ id: string } | { fehler: string }>;
  verkaeuferPerLogin(
    email: string,
    passwort: string,
  ): Promise<Verkaeufer | null>;
  verkaeufer(id: string): Promise<Verkaeufer | null>;
  ustPruefungSpeichern(
    id: string,
    ergebnis: string,
    geprueftAm: string,
  ): Promise<void>;

  // Produkte des angemeldeten Verkäufers
  eigeneProdukte(sellerId: string): Promise<Produkt[]>;
  produktAnlegen(sellerId: string, daten: NeuesProdukt): Promise<Produkt>;
  produktAktualisieren(
    sellerId: string,
    produktId: string,
    daten: Partial<NeuesProdukt> & { status?: ProduktStatus },
  ): Promise<Produkt | null>;
  produktDateiSpeichern(
    sellerId: string,
    produktId: string,
    datei: { name: string; groesse: number; inhalt: Uint8Array },
  ): Promise<{ pfad: string } | { fehler: string }>;

  // Bestellungen
  eigeneBestellungen(sellerId: string): Promise<Bestellung[]>;
}
