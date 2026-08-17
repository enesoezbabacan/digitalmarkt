import type { Metadata } from "next";
import Link from "next/link";

import { ANBIETER, anschriftEinzeilig } from "@/lib/anbieter";
import { PROVISION_PROZENT } from "@/lib/geld";
import { BEDINGUNGEN_STAND } from "@/lib/bedingungen";
import { Rechtshinweis } from "../hinweis";

export const metadata: Metadata = { title: "Verkäufervertrag" };

/**
 * Vertrag zwischen Betreiber und Verkäufer.
 *
 * Bewusst KEINE Wiederholung der AGB. Die AGB regeln bereits Rolle des
 * Betreibers, Pflichten des Verkäufers, Provisionshöhe, Meldeverfahren,
 * Haftung, Freistellung, Kündigung und Gerichtsstand. Was dort steht, wird
 * hier nur in Bezug genommen — doppelte Regelungen widersprechen sich
 * irgendwann, und dann gewinnt im Zweifel die für den Betreiber ungünstigere.
 *
 * Hier steht ausschließlich, was die AGB nicht abdecken und was zwischen
 * zwei Unternehmern zusätzlich geregelt sein muss:
 *
 *   § 1 Rechteeinräumung — die größte Lücke. Ohne sie darf der Betreiber die
 *       Datei des Verkäufers gar nicht speichern und an Käufer ausliefern.
 *   § 2 Beschaffenheit der Datei
 *   § 3 Zahlungsabwicklung über Stripe Connect
 *   § 4 Erstattungen und Rückbuchungen — wer sie trägt
 *   § 5 Steuern
 *   § 6 Datenschutz, getrennte Verantwortlichkeit
 *   § 7 Ende des Vertrags und Schicksal der Dateien
 *   § 8 Verhältnis zu den AGB
 */

function Paragraf({
  nummer,
  titel,
  children,
}: {
  nummer: number;
  titel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold">
        § {nummer} {titel}
      </h2>
      <div className="mt-2 space-y-3 text-neutral-800">{children}</div>
    </section>
  );
}

export default function Seite() {
  return (
    <>
      <Rechtshinweis />

      <h1 className="text-3xl font-semibold tracking-tight">
        Verkäufervertrag
      </h1>
      <p className="text-neutral-600">
        Ergänzende Vereinbarung zwischen {ANBIETER.name},{" "}
        {anschriftEinzeilig()} (&bdquo;Betreiber&ldquo;) und dem Verkäufer für
        den
        Marktplatz {ANBIETER.domain}
      </p>

      <div className="mt-6 rounded-md border border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-700">
        Diese Vereinbarung gilt zusätzlich zu den{" "}
        <Link href="/agb" className="underline">
          Allgemeinen Geschäftsbedingungen
        </Link>
        . Sie richtet sich ausschließlich an Unternehmer im Sinne des § 14 BGB.
        Verkäufer kann nur werden, wer unternehmerisch tätig ist.
      </div>

      <Paragraf nummer={1} titel="Rechteeinräumung">
        <p>
          Der Verkäufer räumt dem Betreiber an jedem eingestellten Produkt ein
          einfaches, räumlich und zeitlich auf die Dauer der Bereitstellung
          beschränktes Recht ein, das für den Betrieb des Marktplatzes
          erforderlich ist. Es umfasst das Recht,
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>die Datei zu speichern und technisch zu sichern,</li>
          <li>
            Titel, Beschreibung, Kategorie und Preis im Katalog, auf
            Produktseiten und in Suchergebnissen öffentlich zugänglich zu
            machen,
          </li>
          <li>
            die Datei an Käufer auszuliefern, die sie über den Marktplatz
            erworben haben,
          </li>
          <li>
            zum Zweck der Bewerbung des Marktplatzes Titel, Beschreibung und
            Preis in Auszügen zu verwenden.
          </li>
        </ul>
        <p>
          Das Recht ist nicht ausschließlich. Der Verkäufer darf dasselbe
          Produkt auch anderswo anbieten. Eine Übertragung des Urheberrechts
          findet nicht statt; sämtliche Rechte verbleiben beim Verkäufer.
        </p>
        <p>
          Das Recht zur Auslieferung an bereits belieferte Käufer besteht über
          das Ende dieses Vertrags hinaus fort, soweit dies zur Erfüllung
          bereits geschlossener Kaufverträge erforderlich ist.
        </p>
      </Paragraf>

      <Paragraf nummer={2} titel="Beschaffenheit der Datei">
        <p>Der Verkäufer sichert zu, dass die eingestellte Datei</p>
        <ul className="ml-5 list-disc space-y-1">
          <li>der Beschreibung im Katalog entspricht,</li>
          <li>frei von Schadsoftware ist,</li>
          <li>
            in einem gängigen, ohne kostenpflichtige Zusatzsoftware lesbaren
            Format vorliegt, oder die benötigte Software in der Beschreibung
            benannt ist,
          </li>
          <li>
            keine technischen Maßnahmen enthält, die den Käufer über den
            vereinbarten Zweck hinaus beschränken oder Daten des Käufers
            übermitteln.
          </li>
        </ul>
        <p>
          Wird eine Datei nachträglich ausgetauscht, gilt die Zusicherung für
          die neue Fassung entsprechend. Der Verkäufer trägt dafür Sorge, dass
          die Beschreibung dann weiterhin zutrifft.
        </p>
      </Paragraf>

      <Paragraf nummer={3} titel="Zahlungsabwicklung">
        <p>
          Die Zahlungen werden über Stripe Connect abgewickelt. Der Verkäufer
          eröffnet dafür ein eigenes Stripe-Konto und schließt mit Stripe einen
          eigenen Vertrag. Ohne ein solches Konto können seine Produkte nicht
          zum Kauf angeboten werden.
        </p>
        <p>
          <strong>
            Die Zahlung des Käufers erfolgt unmittelbar an den Verkäufer.
          </strong>{" "}
          Der Betreiber wird zu keinem Zeitpunkt Inhaber der Kaufpreisforderung
          und nimmt keine Gelder des Verkäufers entgegen. Er behält bei der
          Abwicklung lediglich seine Provision von {PROVISION_PROZENT} % ein.
          Die Auszahlung an den Verkäufer nimmt Stripe nach den mit Stripe
          vereinbarten Fristen vor; der Betreiber hat darauf keinen Einfluss und
          schuldet keine Auszahlung.
        </p>
        <p>
          Die von Stripe erhobenen Transaktionsgebühren trägt der Verkäufer.
        </p>
      </Paragraf>

      <Paragraf nummer={4} titel="Erstattungen und Rückbuchungen">
        <p>
          Über Erstattungen entscheidet der Verkäufer; der Kaufvertrag besteht
          zwischen ihm und dem Käufer. Der Betreiber ist berechtigt, eine
          Erstattung auch selbst auszulösen, wenn der Verkäufer auf eine
          berechtigte Beanstandung nicht innerhalb von sieben Tagen reagiert
          oder wenn ihn eine gesetzliche oder behördliche Pflicht dazu
          verpflichtet.
        </p>
        <p>
          <strong>
            Erstattete Beträge und Rückbuchungen (Chargebacks) einschließlich
            der hierfür von Stripe erhobenen Gebühren trägt der Verkäufer.
          </strong>{" "}
          Der Provisionsanspruch des Betreibers entfällt in diesem Fall; eine
          bereits abgerechnete Provision wird im Wege der Rechnungskorrektur
          rückgängig gemacht.
        </p>
      </Paragraf>

      <Paragraf nummer={5} titel="Steuern">
        <p>
          Der Verkäufer erbringt die Leistung an den Käufer im eigenen Namen und
          auf eigene Rechnung. Er ist allein dafür verantwortlich, den Umsatz
          zutreffend zu versteuern, gegenüber dem Käufer die gesetzlich
          vorgeschriebenen Angaben zu machen und, soweit erforderlich, eine
          Rechnung zu erteilen.
        </p>
        <p>
          Der Betreiber rechnet seine Provision gegenüber dem Verkäufer durch
          eigene Rechnung ab. Er schuldet keine steuerliche Beratung.
        </p>
        <p>
          Ist der Verkäufer Kleinunternehmer nach § 19 UStG, teilt er dies bei
          der Registrierung mit; der Preishinweis auf der Produktseite richtet
          sich danach. Ändert sich dieser Status, ist der Verkäufer
          verpflichtet, die Angabe unverzüglich zu berichtigen.
        </p>
      </Paragraf>

      <Paragraf nummer={6} titel="Datenschutz">
        <p>
          Betreiber und Verkäufer sind hinsichtlich der Daten der Käufer
          jeweils eigenständig Verantwortliche im Sinne des Art. 4 Nr. 7 DSGVO.
          Eine Auftragsverarbeitung oder gemeinsame Verantwortlichkeit wird
          nicht begründet.
        </p>
        <p>
          Der Betreiber übermittelt dem Verkäufer die zur Abwicklung des Kaufs
          erforderlichen Daten, insbesondere die E-Mail-Adresse des Käufers und
          den gekauften Artikel. Der Verkäufer darf diese Daten ausschließlich
          zur Abwicklung des Kaufvertrags und zur Erfüllung seiner
          gesetzlichen Pflichten verwenden.{" "}
          <strong>
            Eine Verwendung zu Werbezwecken ist ohne gesonderte Einwilligung des
            Käufers unzulässig.
          </strong>
        </p>
      </Paragraf>

      <Paragraf nummer={7} titel="Ende des Vertrags">
        <p>
          Für Laufzeit und Kündigung gilt § 11 der AGB. Mit Wirksamwerden der
          Kündigung werden die Produkte des Verkäufers aus dem Katalog
          entfernt.
        </p>
        <p>
          Die Dateien werden nicht sofort gelöscht: Der Betreiber bewahrt sie so
          lange auf, wie dies zur Erfüllung bereits geschlossener Kaufverträge
          und zur Einhaltung gesetzlicher Aufbewahrungsfristen erforderlich ist.
          Danach werden sie gelöscht. Der Verkäufer ist selbst dafür
          verantwortlich, eine eigene Sicherungskopie seiner Dateien
          vorzuhalten; der Marktplatz ist kein Datensicherungsdienst.
        </p>
      </Paragraf>

      <Paragraf nummer={8} titel="Verhältnis zu den AGB">
        <p>
          Ergänzend gelten die{" "}
          <Link href="/agb" className="underline">
            Allgemeinen Geschäftsbedingungen
          </Link>{" "}
          in ihrer jeweils gültigen Fassung, insbesondere zu Pflichten des
          Verkäufers (§ 6), Provision (§ 7), Meldungen und Maßnahmen (§ 8),
          Haftung (§ 9), Freistellung (§ 10), Kündigung (§ 11) und
          Schlussbestimmungen (§ 13).
        </p>
        <p>
          Bei Widersprüchen zwischen dieser Vereinbarung und den AGB geht diese
          Vereinbarung vor.
        </p>
      </Paragraf>

      <p className="mt-10 text-sm text-neutral-500">Stand: {BEDINGUNGEN_STAND}</p>
    </>
  );
}
