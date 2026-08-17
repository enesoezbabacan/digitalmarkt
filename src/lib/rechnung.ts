import PDFDocument from "pdfkit";

import { ANBIETER } from "@/lib/anbieter";
import { formatEuro, PROVISION_PROZENT } from "@/lib/geld";
import { supabaseService } from "@/lib/supabase/service";

/**
 * Provisionsrechnungen des Marktplatzbetreibers an seine Verkäufer.
 *
 * WARUM RECHNUNG UND NICHT GUTSCHRIFT
 *
 * Der ursprüngliche Auftrag verlangte Gutschriften. Das passt nicht zum
 * gewählten Zahlungsmodell: Bei Direct Charges verkauft der Verkäufer im
 * eigenen Namen, und der Betreiber erbringt ihm gegenüber eine
 * Vermittlungsleistung. Wer eine Leistung erbringt, stellt dafür eine
 * RECHNUNG. Eine Gutschrift im Sinne des § 14 Abs. 2 Satz 2 UStG wäre der
 * umgekehrte Fall — der Leistungsempfänger rechnet ab.
 *
 * Diese Einordnung sollte der Steuerberater bestätigen; sie steht als offener
 * Punkt in der README.
 */

/** Umsatzsteuersatz der Provision in Prozentpunkten. */
function ustProzent(): number {
  // Als Kleinunternehmer nach § 19 UStG wird keine Umsatzsteuer ausgewiesen.
  // Sobald der Betreiber regelbesteuert ist, steht hier 19.
  return (process.env.UST_MODUS ?? "kleinunternehmer") === "kleinunternehmer"
    ? 0
    : Number(process.env.UST_SATZ ?? 19);
}

export type RechnungsEmpfaenger = {
  name: string;
  strasse: string;
  plz: string;
  ort: string;
  land: string;
  steuernummer: string | null;
  ust_id: string | null;
};

export type Rechnung = {
  nummer: string;
  leistungsdatum: string;
  betrag_cent: number;
  ust_prozent: number;
  ust_cent: number;
  empfaenger: RechnungsEmpfaenger;
  created_at: string;
  bestellung: {
    id: string;
    produkt_titel: string;
    verkaufspreis_cent: number;
    created_at: string;
  };
};

/**
 * Nächste freie Rechnungsnummer im Format P-JJJJ-NNNN.
 *
 * Bewusst pro Jahr neu beginnend — das ist die verbreitetste Form und macht
 * die Zuordnung im Jahresabschluss leichter. Die Eindeutigkeit erzwingt die
 * Datenbank (unique auf nummer); bei einem Zusammenstoß wird erneut versucht.
 */
async function naechsteNummer(jahr: number): Promise<string> {
  const sb = supabaseService();
  const praefix = `P-${jahr}-`;

  const { data, error } = await sb
    .from("commission_invoices")
    .select("nummer")
    .like("nummer", `${praefix}%`)
    .order("nummer", { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(`Rechnungsnummer konnte nicht ermittelt werden: ${error.message}`);
  }

  const letzte = data?.[0]?.nummer;
  const zaehler = letzte ? Number(letzte.slice(praefix.length)) + 1 : 1;
  return `${praefix}${String(zaehler).padStart(4, "0")}`;
}

/**
 * Erstellt die Provisionsrechnung zu einer Bestellung — oder gibt die
 * vorhandene zurück.
 *
 * Idempotent: Eine zweite Anforderung erzeugt KEINE zweite Rechnung. Zwei
 * Rechnungen über denselben Vorgang wären ein Buchführungsfehler.
 */
export async function rechnungSicherstellen(bestellungId: string): Promise<Rechnung> {
  const sb = supabaseService();

  const { data: vorhanden } = await sb
    .from("commission_invoices")
    .select("*")
    .eq("order_id", bestellungId)
    .maybeSingle();

  const { data: bestellung, error: fehlerBestellung } = await sb
    .from("orders")
    .select("id, betrag_cent, provision_cent, created_at, seller_id, products!inner(titel)")
    .eq("id", bestellungId)
    .maybeSingle();

  if (fehlerBestellung || !bestellung) {
    throw new Error("Die Bestellung wurde nicht gefunden.");
  }

  const bestellDaten = {
    id: bestellung.id as string,
    produkt_titel: (bestellung.products as unknown as { titel: string }).titel,
    verkaufspreis_cent: bestellung.betrag_cent as number,
    created_at: bestellung.created_at as string,
  };

  if (vorhanden) {
    return {
      nummer: vorhanden.nummer,
      leistungsdatum: vorhanden.leistungsdatum,
      betrag_cent: vorhanden.betrag_cent,
      ust_prozent: vorhanden.ust_prozent,
      ust_cent: vorhanden.ust_cent,
      empfaenger: vorhanden.empfaenger as RechnungsEmpfaenger,
      created_at: vorhanden.created_at,
      bestellung: bestellDaten,
    };
  }

  const { data: verkaeufer, error: fehlerVerkaeufer } = await sb
    .from("sellers")
    .select("name, strasse, plz, ort, land, steuernummer, ust_id")
    .eq("id", bestellung.seller_id)
    .maybeSingle();

  if (fehlerVerkaeufer || !verkaeufer) {
    throw new Error("Die Verkäuferangaben wurden nicht gefunden.");
  }

  const satz = ustProzent();
  const netto = bestellung.provision_cent as number;
  // Kaufmännisch runden, damit sich Netto + USt exakt zum Bruttobetrag addiert.
  const ust = Math.round((netto * satz) / 100);
  const leistungsdatum = (bestellung.created_at as string).slice(0, 10);
  const jahr = Number(leistungsdatum.slice(0, 4));

  // Bei gleichzeitigem Zugriff kann die Nummer schon vergeben sein. Dann neu
  // ermitteln statt scheitern — passiert selten, aber es darf keine Rechnung
  // deswegen verloren gehen.
  for (let versuch = 0; versuch < 5; versuch++) {
    const nummer = await naechsteNummer(jahr);

    const { data: neu, error } = await sb
      .from("commission_invoices")
      .insert({
        order_id: bestellungId,
        nummer,
        leistungsdatum,
        betrag_cent: netto,
        ust_prozent: satz,
        ust_cent: ust,
        empfaenger: verkaeufer,
      })
      .select("*")
      .single();

    if (!error && neu) {
      return {
        nummer: neu.nummer,
        leistungsdatum: neu.leistungsdatum,
        betrag_cent: neu.betrag_cent,
        ust_prozent: neu.ust_prozent,
        ust_cent: neu.ust_cent,
        empfaenger: neu.empfaenger as RechnungsEmpfaenger,
        created_at: neu.created_at,
        bestellung: bestellDaten,
      };
    }

    // 23505 = unique_violation. Bei order_id bedeutet das: parallel erstellt.
    if (error?.code !== "23505") {
      throw new Error(`Die Rechnung konnte nicht angelegt werden: ${error?.message}`);
    }

    const { data: jetztDoch } = await sb
      .from("commission_invoices")
      .select("*")
      .eq("order_id", bestellungId)
      .maybeSingle();

    if (jetztDoch) {
      return {
        nummer: jetztDoch.nummer,
        leistungsdatum: jetztDoch.leistungsdatum,
        betrag_cent: jetztDoch.betrag_cent,
        ust_prozent: jetztDoch.ust_prozent,
        ust_cent: jetztDoch.ust_cent,
        empfaenger: jetztDoch.empfaenger as RechnungsEmpfaenger,
        created_at: jetztDoch.created_at,
        bestellung: bestellDaten,
      };
    }
  }

  throw new Error("Die Rechnungsnummer konnte nicht vergeben werden.");
}

function datumDeutsch(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Erzeugt das Rechnungs-PDF.
 *
 * Enthält alle Pflichtangaben nach § 14 Abs. 4 UStG:
 * Name und Anschrift beider Seiten, Steuernummer, Ausstellungsdatum,
 * fortlaufende Nummer, Leistungsbeschreibung, Zeitpunkt der Leistung,
 * Entgelt und Steuerbetrag beziehungsweise der Hinweis auf die Steuerbefreiung.
 */
export async function rechnungPdf(rechnung: Rechnung): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 56 });
  const teile: Buffer[] = [];
  doc.on("data", (t: Buffer) => teile.push(t));

  const fertig = new Promise<Buffer>((fertigstellen) => {
    doc.on("end", () => fertigstellen(Buffer.concat(teile)));
  });

  const brutto = rechnung.betrag_cent + rechnung.ust_cent;

  // --- Kopf ---------------------------------------------------------------
  // § 14 Abs. 4 Nr. 1 UStG verlangt den vollständigen Namen des leistenden
  // Unternehmers. Beim Einzelunternehmen ist das der Personenname — die
  // Geschäftsbezeichnung ist nur ein Zusatz und steht deshalb darunter, nicht
  // an seiner Stelle.
  doc.font("Helvetica-Bold").fontSize(18).text(ANBIETER.name);
  doc.font("Helvetica").fontSize(9).fillColor("#555555");
  doc.text(
    `${ANBIETER.geschaeftsbezeichnung} · ${ANBIETER.strasse} · ${ANBIETER.plz} ${ANBIETER.ort}`,
  );
  doc.text(`${ANBIETER.email}${ANBIETER.telefon ? " · " + ANBIETER.telefon : ""}`);
  doc.fillColor("#000000");
  doc.moveDown(2);

  // --- Empfänger ----------------------------------------------------------
  const e = rechnung.empfaenger;
  doc.fontSize(10);
  doc.text(e.name);
  doc.text(e.strasse);
  doc.text(`${e.plz} ${e.ort}`);
  if (e.land && e.land !== "DE") doc.text(e.land);
  doc.moveDown(2);

  // --- Rechnungskopf ------------------------------------------------------
  doc.font("Helvetica-Bold").fontSize(15).text("Provisionsabrechnung");
  doc.moveDown(0.6);
  doc.font("Helvetica").fontSize(10);

  const zeile = (bezeichnung: string, wert: string) => {
    doc.text(`${bezeichnung}: ${wert}`);
  };
  zeile("Rechnungsnummer", rechnung.nummer);
  zeile("Rechnungsdatum", datumDeutsch(rechnung.created_at));
  zeile("Leistungsdatum", datumDeutsch(rechnung.leistungsdatum));
  if (ANBIETER.ustIdNr) zeile("USt-IdNr. des Ausstellers", ANBIETER.ustIdNr);
  doc.moveDown(1.5);

  // --- Position -----------------------------------------------------------
  const links = doc.page.margins.left;
  const rechts = doc.page.width - doc.page.margins.right;
  let y = doc.y;

  doc.font("Helvetica-Bold").fontSize(9);
  doc.text("Leistung", links, y);
  doc.text("Betrag", rechts - 90, y, { width: 90, align: "right" });
  y += 16;
  doc.moveTo(links, y).lineTo(rechts, y).strokeColor("#cccccc").stroke();
  y += 10;

  doc.font("Helvetica").fontSize(10);
  const beschreibung =
    `Vermittlungsprovision ${PROVISION_PROZENT} % für den Verkauf von ` +
    `„${rechnung.bestellung.produkt_titel}“ über ${ANBIETER.domain}`;
  const hoehe = doc.heightOfString(beschreibung, { width: rechts - links - 110 });
  doc.text(beschreibung, links, y, { width: rechts - links - 110 });
  doc.text(formatEuro(rechnung.betrag_cent), rechts - 90, y, {
    width: 90,
    align: "right",
  });
  y += Math.max(hoehe, 14) + 6;

  doc.fontSize(8).fillColor("#555555");
  doc.text(
    `Verkaufspreis ${formatEuro(rechnung.bestellung.verkaufspreis_cent)} · ` +
      `Verkauf am ${datumDeutsch(rechnung.bestellung.created_at)}`,
    links,
    y,
  );
  doc.fillColor("#000000");
  y += 22;

  doc.moveTo(links, y).lineTo(rechts, y).strokeColor("#cccccc").stroke();
  y += 12;

  // --- Summen -------------------------------------------------------------
  const summe = (bezeichnung: string, wert: string, fett = false) => {
    doc.font(fett ? "Helvetica-Bold" : "Helvetica").fontSize(10);
    doc.text(bezeichnung, rechts - 260, y, { width: 160, align: "right" });
    doc.text(wert, rechts - 90, y, { width: 90, align: "right" });
    y += 16;
  };

  if (rechnung.ust_prozent > 0) {
    summe("Nettobetrag", formatEuro(rechnung.betrag_cent));
    summe(`zzgl. ${rechnung.ust_prozent} % USt.`, formatEuro(rechnung.ust_cent));
    summe("Rechnungsbetrag", formatEuro(brutto), true);
  } else {
    summe("Rechnungsbetrag", formatEuro(brutto), true);
  }

  // --- Hinweise -----------------------------------------------------------
  //
  // Schreibposition ausdrücklich zurück an den linken Rand setzen. pdfkit
  // merkt sich x von der letzten Ausgabe — das war die rechtsbündige
  // Summenspalte. Ohne dieses Zurücksetzen laufen alle folgenden Absätze in
  // einer 90 Punkt schmalen Spalte und brechen nach zwei Wörtern um.
  const breite = rechts - links;
  y += 20;

  doc.font("Helvetica").fontSize(9).fillColor("#333333");

  const absatz = (inhalt: string) => {
    doc.text(inhalt, links, y, { width: breite });
    y = doc.y + 8;
  };

  if (rechnung.ust_prozent === 0) {
    absatz(
      "Gemäß § 19 UStG wird keine Umsatzsteuer berechnet " +
        "(Kleinunternehmerregelung).",
    );
  }

  absatz(
    "Der Betrag wurde bereits einbehalten. Die Provision wird bei der " +
      "Zahlungsabwicklung unmittelbar vom Verkaufserlös abgezogen; eine " +
      "gesonderte Zahlung ist nicht erforderlich.",
  );
  absatz(
    "Der Kaufvertrag über das Produkt besteht zwischen dem Verkäufer und " +
      "dem Käufer. Diese Rechnung betrifft ausschließlich die " +
      "Vermittlungsleistung des Marktplatzes.",
  );

  doc.fillColor("#888888").fontSize(8);
  doc.text(
    `${ANBIETER.name} · ${ANBIETER.rechtsform} · ${ANBIETER.strasse}, ` +
      `${ANBIETER.plz} ${ANBIETER.ort}`,
    links,
    y + 24,
    { width: breite, align: "center" },
  );

  doc.end();
  return fertig;
}
