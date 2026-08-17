import type { Metadata } from "next";

import { ANBIETER, anschriftEinzeilig } from "@/lib/anbieter";
import { BEDINGUNGEN_STAND } from "@/lib/bedingungen";
import { Rechtshinweis } from "../hinweis";

export const metadata: Metadata = { title: "Datenschutzerklärung" };

function Abschnitt({
  titel,
  children,
}: {
  titel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold">{titel}</h2>
      <div className="mt-2 space-y-3 text-neutral-800">{children}</div>
    </section>
  );
}

/** Ein Empfänger von Daten, mit Zweck und Rechtsgrundlage. */
function Dienst({
  name,
  anbieter,
  zweck,
  daten,
  grundlage,
}: {
  name: string;
  anbieter: string;
  zweck: string;
  daten: string;
  grundlage: string;
}) {
  return (
    <div className="rounded-md border border-neutral-200 p-4">
      <h3 className="font-medium">{name}</h3>
      <dl className="mt-2 space-y-1 text-sm text-neutral-700">
        <div className="flex gap-2">
          <dt className="w-28 shrink-0 text-neutral-500">Anbieter</dt>
          <dd>{anbieter}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-28 shrink-0 text-neutral-500">Zweck</dt>
          <dd>{zweck}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-28 shrink-0 text-neutral-500">Daten</dt>
          <dd>{daten}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-28 shrink-0 text-neutral-500">Grundlage</dt>
          <dd>{grundlage}</dd>
        </div>
      </dl>
    </div>
  );
}

export default function Seite() {
  return (
    <>
      <Rechtshinweis />

      <h1 className="text-3xl font-semibold tracking-tight">
        Datenschutzerklärung
      </h1>

      <Abschnitt titel="Verantwortlicher">
        <p className="whitespace-pre-line">
          {ANBIETER.name}
          {"\n"}
          {ANBIETER.geschaeftsbezeichnung}
          {"\n"}
          {anschriftEinzeilig()}
          {"\n"}
          {ANBIETER.land}
        </p>
        <p>
          E-Mail:{" "}
          <a href={`mailto:${ANBIETER.email}`} className="underline">
            {ANBIETER.email}
          </a>
        </p>
        <p className="text-sm text-neutral-600">
          Ein Datenschutzbeauftragter ist nicht bestellt; die gesetzlichen
          Voraussetzungen dafür liegen nicht vor.
        </p>
      </Abschnitt>

      <Abschnitt titel="Grundsatz">
        <p>
          Wir verarbeiten personenbezogene Daten nur, soweit das für den Betrieb
          des Marktplatzes erforderlich ist. Es findet{" "}
          <strong>kein Tracking</strong> statt: Wir setzen keine Analyse- oder
          Werbedienste ein, binden keine externen Schriftarten oder Karten ein
          und verwenden keine Cookies, die eine Einwilligung erfordern würden.
          Deshalb gibt es auf dieser Seite auch kein Cookie-Banner.
        </p>
      </Abschnitt>

      <Abschnitt titel="Beim Aufruf der Website">
        <p>
          Beim Aufruf werden technisch notwendige Daten verarbeitet: IP-Adresse,
          Datum und Uhrzeit, aufgerufene Adresse, übertragene Datenmenge,
          Browsertyp und Betriebssystem. Diese Daten sind erforderlich, um die
          Seite auszuliefern und die Stabilität und Sicherheit des Systems zu
          gewährleisten.
        </p>
        <p>
          Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes
          Interesse liegt im sicheren und störungsfreien Betrieb.
        </p>
      </Abschnitt>

      <Abschnitt titel="Beim Kauf eines Produkts">
        <p>
          Für einen Kauf verarbeiten wir deine E-Mail-Adresse, den Kaufbetrag,
          das gekaufte Produkt, den Zeitpunkt deiner Zustimmung zum sofortigen
          Download und dein Rechnungsland. Die Zahlungsdaten selbst (Karten- oder
          Kontodaten) erreichen uns zu keinem Zeitpunkt — sie werden
          ausschließlich von Stripe verarbeitet.
        </p>
        <p>
          Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Erfüllung des
          Vertrags) sowie Art. 6 Abs. 1 lit. c DSGVO für die steuer- und
          handelsrechtliche Aufbewahrung.
        </p>
        <p>
          <strong>Weitergabe an den Verkäufer:</strong> Da der Kaufvertrag mit
          dem Verkäufer zustande kommt, erhält dieser die zur Vertragserfüllung
          erforderlichen Angaben — insbesondere deine E-Mail-Adresse und das
          gekaufte Produkt. Grundlage ist Art. 6 Abs. 1 lit. b DSGVO.
        </p>
        <p>
          Das <strong>Rechnungsland</strong> und ein daraus abgeleiteter Hinweis
          auf das Land deiner IP-Adresse werden gespeichert, weil bei digitalen
          Leistungen innerhalb der EU zwei voneinander unabhängige Nachweise zum
          Ort des Leistungsempfängers vorzuhalten sind.
        </p>
      </Abschnitt>

      <Abschnitt titel="Beim Verkäuferkonto">
        <p>
          Wer als Verkäufer ein Konto anlegt, gibt Name, E-Mail-Adresse,
          Telefonnummer, ladungsfähige Anschrift und Steuernummer an,
          gegebenenfalls zusätzlich eine Umsatzsteuer-Identifikationsnummer.
          Diese Angaben sind nach Art. 30 DSA gesetzlich vorgeschrieben — ohne
          sie ist ein Verkauf über den Marktplatz nicht möglich.
        </p>
        <p>
          Name, Ort und Land des Verkäufers werden auf der Produktseite{" "}
          <strong>öffentlich angezeigt</strong>, damit Käufer erkennen können,
          mit wem sie den Vertrag schließen. Anschrift, Telefonnummer und
          Steuernummer werden nicht veröffentlicht.
        </p>
        <p>
          Eine angegebene Umsatzsteuer-Identifikationsnummer wird gegen die
          Datenbank der Europäischen Kommission (MIAS/VIES) geprüft. Diese
          Prüfung verlangt Art. 30 Abs. 2 DSA. Übermittelt wird dabei allein die
          Nummer selbst.
        </p>
        <p>
          Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Nutzungsverhältnis)
          und Art. 6 Abs. 1 lit. c DSGVO (gesetzliche Verpflichtung).
        </p>
      </Abschnitt>

      <Abschnitt titel="Bei einer Meldung nach Art. 16 DSA">
        <p>
          Wer eine Rechtsverletzung meldet, gibt eine E-Mail-Adresse und
          optional einen Namen an. Wir verarbeiten diese Angaben, um die Meldung
          zu bearbeiten, den Eingang zu bestätigen und die Entscheidung
          mitzuteilen. Die Angaben werden dem betroffenen Verkäufer nur
          weitergegeben, soweit das zur Bearbeitung erforderlich ist.
        </p>
        <p>
          Rechtsgrundlage ist Art. 6 Abs. 1 lit. c DSGVO in Verbindung mit
          Art. 16 DSA.
        </p>
      </Abschnitt>

      <Abschnitt titel="Empfänger deiner Daten">
        <p>
          Wir setzen die folgenden Dienstleister ein. Mit allen bestehen die
          erforderlichen Verträge zur Auftragsverarbeitung nach Art. 28 DSGVO,
          soweit sie in dieser Rolle tätig werden.
        </p>

        <div className="not-prose space-y-3">
          <Dienst
            name="Hosting"
            anbieter="Vercel Inc., USA — Auslieferung über Rechenzentren in der EU"
            zweck="Betrieb und Auslieferung der Website"
            daten="Server-Logdaten, IP-Adresse"
            grundlage="Art. 6 Abs. 1 lit. f DSGVO"
          />
          <Dienst
            name="Datenbank und Dateiablage"
            anbieter="Supabase Inc., USA — Serverstandort Frankfurt am Main"
            zweck="Speicherung von Konten, Produkten und Bestellungen"
            daten="alle in dieser Erklärung genannten Bestandsdaten"
            grundlage="Art. 6 Abs. 1 lit. b DSGVO"
          />
          <Dienst
            name="Zahlungsabwicklung"
            anbieter="Stripe Payments Europe, Ltd., Irland"
            zweck="Abwicklung der Zahlung und Auszahlung an den Verkäufer"
            daten="Zahlungsdaten, E-Mail-Adresse, Rechnungsland, Betrag"
            grundlage="Art. 6 Abs. 1 lit. b DSGVO"
          />
          <Dienst
            name="E-Mail-Versand"
            anbieter="Resend, Inc., USA"
            zweck="Kaufbestätigung, Download-Link, Benachrichtigungen"
            daten="E-Mail-Adresse, Inhalt der Nachricht"
            grundlage="Art. 6 Abs. 1 lit. b DSGVO"
          />
        </div>

        <p>
          Soweit Daten in die USA übermittelt werden, stützt sich die
          Übermittlung auf einen Angemessenheitsbeschluss der Europäischen
          Kommission oder auf Standardvertragsklauseln nach Art. 46 Abs. 2
          lit. c DSGVO.
        </p>
        <p className="text-sm text-neutral-600">
          Stripe ist bei der Zahlungsabwicklung nicht Auftragsverarbeiter,
          sondern eigenständig Verantwortlicher. Es gilt insoweit die
          Datenschutzerklärung von Stripe.
        </p>
      </Abschnitt>

      <Abschnitt titel="Speicherdauer">
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <strong>Server-Logdaten:</strong> in der Regel wenige Tage, danach
            automatische Löschung.
          </li>
          <li>
            <strong>Download-Links:</strong> werden nach Ablauf der Gültigkeit
            unbrauchbar.
          </li>
          <li>
            <strong>Bestellungen und Rechnungsdaten:</strong> zehn Jahre nach
            Ablauf des Kalenderjahres (§ 147 AO, § 257 HGB).
          </li>
          <li>
            <strong>Verkäuferkonten:</strong> für die Dauer des
            Nutzungsverhältnisses; danach werden die Daten gelöscht, soweit
            keine Aufbewahrungspflicht besteht.
          </li>
          <li>
            <strong>Meldungen nach Art. 16 DSA:</strong> solange das für die
            Bearbeitung und den Nachweis der ordnungsgemäßen Behandlung
            erforderlich ist.
          </li>
        </ul>
      </Abschnitt>

      <Abschnitt titel="Deine Rechte">
        <p>Du hast jederzeit das Recht auf</p>
        <ul className="ml-5 list-disc space-y-1">
          <li>Auskunft über die zu deiner Person gespeicherten Daten (Art. 15)</li>
          <li>Berichtigung unrichtiger Daten (Art. 16)</li>
          <li>Löschung (Art. 17)</li>
          <li>Einschränkung der Verarbeitung (Art. 18)</li>
          <li>Datenübertragbarkeit (Art. 20)</li>
          <li>
            <strong>Widerspruch</strong> gegen Verarbeitungen, die auf Art. 6
            Abs. 1 lit. f DSGVO beruhen (Art. 21)
          </li>
        </ul>
        <p>
          Zur Ausübung genügt eine formlose Nachricht an{" "}
          <a href={`mailto:${ANBIETER.email}`} className="underline">
            {ANBIETER.email}
          </a>
          .
        </p>
      </Abschnitt>

      <Abschnitt titel="Beschwerderecht">
        <p>
          Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu
          beschweren. Für uns zuständig ist:
        </p>
        <p className="whitespace-pre-line">
          {ANBIETER.datenschutzAufsicht.name}
          {"\n"}
          {ANBIETER.datenschutzAufsicht.anschrift}
          {"\n"}
          {ANBIETER.datenschutzAufsicht.web}
        </p>
      </Abschnitt>

      <p className="mt-10 text-sm text-neutral-500">Stand: {BEDINGUNGEN_STAND}</p>
    </>
  );
}
