import { Resend } from "resend";

import { formatEuro } from "@/lib/geld";

/**
 * Transaktionsmails über Resend.
 *
 * Wichtig: Ein fehlgeschlagener Mailversand darf NIE einen bezahlten Kauf
 * scheitern lassen. Die Bestellung ist der verbindliche Vorgang, die Mail nur
 * die Benachrichtigung. Deshalb fangen alle Funktionen hier ihre Fehler selbst
 * ab und melden sie nur ins Protokoll — der Download-Link bleibt über die
 * Bestellung auch ohne Mail erreichbar.
 */

/**
 * Absenderadresse.
 *
 * Solange keine eigene Domain bei Resend verifiziert ist, funktioniert nur
 * `onboarding@resend.dev` — und der Versand geht dann ausschließlich an die
 * eigene Kontoadresse. Für den Echtbetrieb muss hier eine Adresse der eigenen
 * Domain stehen (z. B. shop@deine-domain.de), sonst landen die Mails im Spam
 * oder werden gar nicht zugestellt.
 */
function absender(): string {
  return process.env.MAIL_ABSENDER ?? "Digitalmarkt <onboarding@resend.dev>";
}

function seitenAdresse(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/+$/,
    "",
  );
}

function resend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

/** Schützt eingesetzte Werte, damit kein HTML aus Nutzerdaten entsteht. */
function escape(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const rahmen = (inhalt: string) => `
<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
            max-width:560px;margin:0 auto;padding:24px;color:#171717;line-height:1.6">
  ${inhalt}
  <hr style="border:none;border-top:1px solid #e5e5e5;margin:32px 0">
  <p style="font-size:12px;color:#737373">
    Diese Nachricht wurde automatisch versendet.
    <a href="${seitenAdresse()}/impressum" style="color:#737373">Impressum</a> ·
    <a href="${seitenAdresse()}/widerruf" style="color:#737373">Widerrufsbelehrung</a>
  </p>
</div>`;

export type KaufMailDaten = {
  kaeuferEmail: string;
  produktTitel: string;
  betragCent: number;
  downloadToken: string;
  tokenAblauf: string;
  verkaeuferName: string;
  maxDownloads: number;
};

/** Bestätigung an den Käufer, mit dem Download-Link. */
export async function kaufBestaetigungSenden(daten: KaufMailDaten) {
  const client = resend();
  if (!client) {
    console.warn("RESEND_API_KEY fehlt — Kaufbestätigung nicht versendet.");
    return;
  }

  const link = `${seitenAdresse()}/download/${daten.downloadToken}`;
  const ablauf = new Date(daten.tokenAblauf).toLocaleString("de-DE", {
    dateStyle: "long",
    timeStyle: "short",
  });

  try {
    await client.emails.send({
      from: absender(),
      to: daten.kaeuferEmail,
      subject: `Dein Download: ${daten.produktTitel}`,
      html: rahmen(`
        <h1 style="font-size:22px;margin:0 0 16px">Danke für deinen Kauf</h1>
        <p>Du hast <strong>${escape(daten.produktTitel)}</strong> für
           ${formatEuro(daten.betragCent)} gekauft.</p>
        <p style="margin:28px 0">
          <a href="${link}"
             style="background:#171717;color:#fff;text-decoration:none;
                    padding:14px 24px;border-radius:6px;display:inline-block;
                    font-weight:600">Jetzt herunterladen</a>
        </p>
        <p style="font-size:14px;color:#525252">
          Der Link ist bis zum <strong>${ablauf}</strong> gültig und kann
          bis zu ${daten.maxDownloads} Mal verwendet werden.
          Lade die Datei am besten gleich herunter und sichere sie.
        </p>
        <p style="font-size:14px;color:#525252">
          Verkäufer dieses Produkts ist ${escape(daten.verkaeuferName)}.
          Der Kaufvertrag besteht zwischen dir und dem Verkäufer.
        </p>
        <p style="font-size:14px;color:#525252">
          Du hast dem sofortigen Beginn der Auslieferung ausdrücklich
          zugestimmt und damit auf dein Widerrufsrecht verzichtet
          (§ 356 Abs. 5 BGB).
        </p>
      `),
    });
  } catch (fehler) {
    // Bewusst nur protokollieren: Der Kauf bleibt gültig, der Download-Link
    // funktioniert. Eine Ausnahme hier würde Stripe zu endlosen Wiederholungen
    // des Webhooks veranlassen.
    console.error("Kaufbestätigung konnte nicht versendet werden:", fehler);
  }
}

export type VerkaufsMeldung = {
  verkaeuferEmail: string;
  produktTitel: string;
  betragCent: number;
  provisionCent: number;
};

/** Benachrichtigung an den Verkäufer über einen Verkauf. */
export async function verkaufsMeldungSenden(daten: VerkaufsMeldung) {
  const client = resend();
  if (!client || !daten.verkaeuferEmail) return;

  const anteil = daten.betragCent - daten.provisionCent;

  try {
    await client.emails.send({
      from: absender(),
      to: daten.verkaeuferEmail,
      subject: `Verkauft: ${daten.produktTitel}`,
      html: rahmen(`
        <h1 style="font-size:22px;margin:0 0 16px">Du hast etwas verkauft</h1>
        <p><strong>${escape(daten.produktTitel)}</strong> wurde gerade gekauft.</p>
        <table style="border-collapse:collapse;margin:20px 0;font-size:15px">
          <tr>
            <td style="padding:6px 24px 6px 0;color:#525252">Verkaufspreis</td>
            <td style="padding:6px 0;text-align:right">${formatEuro(daten.betragCent)}</td>
          </tr>
          <tr>
            <td style="padding:6px 24px 6px 0;color:#525252">Provision Marktplatz</td>
            <td style="padding:6px 0;text-align:right">− ${formatEuro(daten.provisionCent)}</td>
          </tr>
          <tr style="border-top:1px solid #e5e5e5">
            <td style="padding:6px 24px 6px 0;font-weight:600">Dein Anteil</td>
            <td style="padding:6px 0;text-align:right;font-weight:600">${formatEuro(anteil)}</td>
          </tr>
        </table>
        <p style="font-size:14px;color:#525252">
          Der Betrag wurde direkt deinem Stripe-Konto gutgeschrieben, abzüglich
          der Stripe-Gebühren. Die Auszahlung erfolgt nach dem bei Stripe
          eingestellten Rhythmus.
        </p>
        <p style="font-size:14px;color:#525252">
          <a href="${seitenAdresse()}/dashboard" style="color:#171717">
            Zum Verkäufer-Bereich
          </a>
        </p>
      `),
    });
  } catch (fehler) {
    console.error("Verkaufsmeldung konnte nicht versendet werden:", fehler);
  }
}

export type NeuerVerkaeuferDaten = {
  name: string;
  email: string;
  ort: string;
};

/**
 * Benachrichtigt den Betreiber über eine neue Verkäufer-Registrierung.
 *
 * Ohne diese Mail müsste der Betreiber von sich aus regelmäßig im
 * Admin-Bereich nachschauen, ob sich jemand angemeldet hat.
 */
export async function neuerVerkaeuferAnBetreiberSenden(
  daten: NeuerVerkaeuferDaten,
) {
  const client = resend();
  const empfaenger = betreiberAdressen();
  if (!client || empfaenger.length === 0) return;

  try {
    await client.emails.send({
      from: absender(),
      to: empfaenger,
      subject: `Neuer Verkäufer: ${daten.name}`,
      html: rahmen(`
        <h1 style="font-size:22px;margin:0 0 16px">Neue Verkäufer-Registrierung</h1>
        <p><strong>${escape(daten.name)}</strong> (${escape(daten.ort)}) hat
           sich als Verkäufer registriert.</p>
        <p style="font-size:14px;color:#525252">E-Mail: ${escape(daten.email)}</p>
        <p style="margin:28px 0">
          <a href="${seitenAdresse()}/admin"
             style="background:#171717;color:#fff;text-decoration:none;
                    padding:14px 24px;border-radius:6px;display:inline-block;
                    font-weight:600">Im Betreiber-Bereich ansehen</a>
        </p>
      `),
    });
  } catch (fehler) {
    console.error("Benachrichtigung über neuen Verkäufer fehlgeschlagen:", fehler);
  }
}

export type ProduktZurPruefungDaten = {
  verkaeuferName: string;
  produktTitel: string;
  kategorie: string;
};

/**
 * Benachrichtigt den Betreiber, sobald ein Verkäufer ein Produkt zur
 * Freigabe einreicht — ohne diese Mail bliebe ein eingereichtes Produkt
 * unbemerkt im Admin-Bereich liegen, bis jemand zufällig nachschaut.
 */
export async function produktZurPruefungAnBetreiberSenden(
  daten: ProduktZurPruefungDaten,
) {
  const client = resend();
  const empfaenger = betreiberAdressen();
  if (!client || empfaenger.length === 0) return;

  try {
    await client.emails.send({
      from: absender(),
      to: empfaenger,
      subject: `Neues Produkt wartet auf Freigabe: ${daten.produktTitel}`,
      html: rahmen(`
        <h1 style="font-size:22px;margin:0 0 16px">Produkt wartet auf Freigabe</h1>
        <p><strong>${escape(daten.verkaeuferName)}</strong> hat
           <strong>${escape(daten.produktTitel)}</strong>
           (${escape(daten.kategorie)}) zur Prüfung eingereicht.</p>
        <p style="margin:28px 0">
          <a href="${seitenAdresse()}/admin"
             style="background:#171717;color:#fff;text-decoration:none;
                    padding:14px 24px;border-radius:6px;display:inline-block;
                    font-weight:600">Jetzt prüfen</a>
        </p>
      `),
    });
  } catch (fehler) {
    console.error("Benachrichtigung über neues Produkt fehlgeschlagen:", fehler);
  }
}

export type MeldungsMailDaten = {
  melderEmail: string;
  melderName?: string | null;
  produktTitel: string;
  kategorie: string;
  begruendung: string;
};

/**
 * Empfänger der Betreiber-Benachrichtigung.
 *
 * Bewusst dieselbe Liste wie für den Admin-Bereich: Wer den Bereich sehen darf,
 * soll auch von Meldungen erfahren. Eine zweite Variable wäre eine zweite
 * Stelle, die man zu pflegen vergessen kann.
 */
function betreiberAdressen(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

/**
 * Benachrichtigt den Betreiber über eine neue Meldung.
 *
 * Art. 16 Abs. 6 DSA verlangt eine zeitnahe Bearbeitung. Ohne diese Mail müsste
 * der Betreiber von sich aus in den Admin-Bereich schauen — und würde eine
 * Meldung im Zweifel tagelang übersehen.
 */
export async function meldungAnBetreiberSenden(daten: MeldungsMailDaten) {
  const client = resend();
  const empfaenger = betreiberAdressen();

  if (!client || empfaenger.length === 0) {
    console.warn(
      "Meldung eingegangen, aber keine Betreiber-Benachrichtigung möglich " +
        "(RESEND_API_KEY oder ADMIN_EMAILS fehlt).",
    );
    return;
  }

  try {
    await client.emails.send({
      from: absender(),
      to: empfaenger,
      // Antwort geht direkt an den Melder — Art. 16 verlangt eine begründete
      // Mitteilung der Entscheidung.
      replyTo: daten.melderEmail,
      subject: `Meldung: ${daten.produktTitel}`,
      html: rahmen(`
        <h1 style="font-size:22px;margin:0 0 16px">Neue Meldung eingegangen</h1>
        <p>Zu <strong>${escape(daten.produktTitel)}</strong> wurde eine
           Rechtsverletzung gemeldet.</p>
        <table style="border-collapse:collapse;margin:20px 0;font-size:15px">
          <tr>
            <td style="padding:6px 24px 6px 0;color:#525252">Kategorie</td>
            <td style="padding:6px 0">${escape(daten.kategorie)}</td>
          </tr>
          <tr>
            <td style="padding:6px 24px 6px 0;color:#525252">Melder</td>
            <td style="padding:6px 0">
              ${escape(daten.melderName || "ohne Namen")} ·
              ${escape(daten.melderEmail)}
            </td>
          </tr>
        </table>
        <p style="white-space:pre-line;background:#f5f5f5;padding:14px;
                  border-radius:6px;font-size:14px">${escape(daten.begruendung)}</p>
        <p style="margin:28px 0">
          <a href="${seitenAdresse()}/admin"
             style="background:#171717;color:#fff;text-decoration:none;
                    padding:14px 24px;border-radius:6px;display:inline-block;
                    font-weight:600">Im Betreiber-Bereich bearbeiten</a>
        </p>
        <p style="font-size:14px;color:#525252">
          Art. 16 DSA verlangt eine zeitnahe und sorgfältige Prüfung sowie eine
          begründete Mitteilung an den Melder. Nimm das Produkt bei berechtigter
          Meldung aus dem Katalog und antworte auf diese Mail.
        </p>
      `),
    });
  } catch (fehler) {
    console.error("Meldung an den Betreiber fehlgeschlagen:", fehler);
  }
}

/**
 * Eingangsbestätigung an den Melder.
 *
 * Art. 16 Abs. 4 DSA: "unverzüglich eine Bestätigung des Eingangs". Das ist
 * keine Höflichkeit, sondern eine Pflicht.
 */
export async function meldungsBestaetigungSenden(daten: MeldungsMailDaten) {
  const client = resend();
  if (!client) return;

  try {
    await client.emails.send({
      from: absender(),
      to: daten.melderEmail,
      subject: "Deine Meldung ist eingegangen",
      html: rahmen(`
        <h1 style="font-size:22px;margin:0 0 16px">Meldung eingegangen</h1>
        <p>Wir haben deine Meldung zu
           <strong>${escape(daten.produktTitel)}</strong> erhalten und werden
           sie prüfen.</p>
        <p style="font-size:14px;color:#525252">
          Gemeldeter Grund: ${escape(daten.kategorie)}
        </p>
        <p style="font-size:14px;color:#525252">
          Wir teilen dir unsere Entscheidung mit und begründen sie. Solltest du
          mit ihr nicht einverstanden sein, kannst du dich an eine
          außergerichtliche Streitbeilegungsstelle nach Art. 21 DSA wenden; der
          Rechtsweg bleibt davon unberührt.
        </p>
      `),
    });
  } catch (fehler) {
    console.error("Eingangsbestätigung konnte nicht versendet werden:", fehler);
  }
}
