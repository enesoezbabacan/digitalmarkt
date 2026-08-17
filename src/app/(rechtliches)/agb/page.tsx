import type { Metadata } from "next";

import { ANBIETER, anschriftEinzeilig } from "@/lib/anbieter";
import { PROVISION_PROZENT } from "@/lib/geld";
import { BEDINGUNGEN_STAND } from "@/lib/bedingungen";
import { Rechtshinweis } from "../hinweis";

export const metadata: Metadata = { title: "Allgemeine Geschäftsbedingungen" };

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
        Allgemeine Geschäftsbedingungen
      </h1>
      <p className="text-neutral-600">
        für die Nutzung des Marktplatzes {ANBIETER.domain}
      </p>

      <Paragraf nummer={1} titel="Betreiber und Geltungsbereich">
        <p>
          Betreiber dieses Marktplatzes ist {ANBIETER.name},{" "}
          {ANBIETER.geschaeftsbezeichnung}, {anschriftEinzeilig()} (nachfolgend
          „Betreiber"). Diese Bedingungen gelten für die Nutzung des
          Marktplatzes durch Käufer und Verkäufer.
        </p>
        <p>
          Abweichende Bedingungen der Nutzer werden nicht Vertragsbestandteil,
          es sei denn, der Betreiber stimmt ihrer Geltung ausdrücklich
          schriftlich zu.
        </p>
      </Paragraf>

      <Paragraf nummer={2} titel="Rolle des Betreibers">
        <p>
          Der Betreiber stellt ausschließlich die technische Plattform bereit.
          Er wird nicht Vertragspartei der über den Marktplatz geschlossenen
          Kaufverträge und macht sich die Inhalte der Verkäufer nicht zu eigen.
        </p>
        <p>
          <strong>
            Der Kaufvertrag kommt ausschließlich zwischen dem Käufer und dem
            jeweiligen Verkäufer zustande.
          </strong>{" "}
          Der Verkäufer ist Anbieter des Produkts, Vertragspartner des Käufers
          und für Inhalt, Rechtmäßigkeit und Mängelfreiheit seines Produkts
          allein verantwortlich.
        </p>
        <p>
          Die Zahlungsabwicklung erfolgt über Stripe. Der Kaufpreis wird direkt
          dem Konto des Verkäufers gutgeschrieben; der Betreiber behält
          lediglich seine Provision ein und wird zu keinem Zeitpunkt Inhaber der
          Kaufpreisforderung.
        </p>
      </Paragraf>

      <Paragraf nummer={3} titel="Vertragsschluss beim Kauf">
        <p>
          Die Darstellung der Produkte im Marktplatz stellt kein rechtlich
          bindendes Angebot dar, sondern eine Aufforderung zur Bestellung.
        </p>
        <p>
          Mit dem Anklicken der Schaltfläche „Zahlungspflichtig bestellen" gibt
          der Käufer ein verbindliches Angebot ab (§ 312j Abs. 3 BGB). Der
          Vertrag kommt mit der Bestätigung der Zahlung zustande. Der Käufer
          erhält unverzüglich eine Bestätigung per E-Mail.
        </p>
        <p>
          Alle Preise sind Endpreise. Ist der Verkäufer Kleinunternehmer nach
          § 19 UStG, wird keine Umsatzsteuer ausgewiesen; darauf wird beim
          jeweiligen Produkt hingewiesen.
        </p>
      </Paragraf>

      <Paragraf nummer={4} titel="Lieferung und Nutzungsrechte">
        <p>
          Die Lieferung erfolgt digital. Nach erfolgreicher Zahlung erhält der
          Käufer per E-Mail einen persönlichen Download-Link. Der Link ist
          zeitlich befristet und in der Anzahl der Abrufe begrenzt; die
          jeweiligen Grenzen sind in der Kaufbestätigung angegeben.
        </p>
        <p>
          Der Käufer erhält ein einfaches, nicht übertragbares Recht, das
          Produkt für eigene Zwecke zu nutzen. Weitergabe, Weiterverkauf und
          öffentliche Zugänglichmachung sind nicht gestattet, soweit der
          Verkäufer nichts anderes bestimmt.
        </p>
      </Paragraf>

      <Paragraf nummer={5} titel="Widerrufsrecht">
        <p>
          Verbrauchern steht ein gesetzliches Widerrufsrecht zu. Da
          ausschließlich digitale Inhalte zum sofortigen Download angeboten
          werden, erlischt dieses Recht unter den Voraussetzungen des § 356
          Abs. 5 BGB. Die Einzelheiten stehen in der{" "}
          <a href="/widerruf" className="underline">
            Widerrufsbelehrung
          </a>
          , die Bestandteil dieser Bedingungen ist.
        </p>
      </Paragraf>

      <Paragraf nummer={6} titel="Pflichten des Verkäufers">
        <p>Wer Produkte einstellt, sichert zu, dass er</p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            über alle erforderlichen Rechte an den eingestellten Inhalten
            verfügt und keine Rechte Dritter verletzt,
          </li>
          <li>
            die nach Art. 30 DSA erforderlichen Angaben vollständig und
            zutreffend macht — insbesondere Name, ladungsfähige Anschrift,
            Telefonnummer und Steuernummer,
          </li>
          <li>
            seinen eigenen gesetzlichen Pflichten gegenüber Käufern nachkommt,
            insbesondere Impressumspflicht, Preisangaben und Widerrufsbelehrung,
          </li>
          <li>
            seinen steuerlichen Pflichten selbst nachkommt; der Betreiber
            schuldet keine steuerliche Beratung.
          </li>
        </ul>
        <p>
          Ändern sich die Angaben, hat der Verkäufer sie unverzüglich zu
          aktualisieren. Der Betreiber ist berechtigt, die Angaben zu
          überprüfen.
        </p>
      </Paragraf>

      <Paragraf nummer={7} titel="Provision">
        <p>
          Für jeden über den Marktplatz vermittelten Verkauf erhält der
          Betreiber eine Provision in Höhe von{" "}
          <strong>{PROVISION_PROZENT} % des Verkaufspreises</strong>. Die
          Provision wird bei der Zahlungsabwicklung unmittelbar einbehalten.
        </p>
        <p>
          Von Stripe erhobene Transaktionsgebühren trägt der Verkäufer. Der
          Betreiber rechnet seine Provision gegenüber dem Verkäufer ab. Bei
          einer Rückabwicklung des Kaufvertrags entfällt der Provisionsanspruch.
        </p>
      </Paragraf>

      <Paragraf nummer={8} titel="Meldungen und Maßnahmen">
        <p>
          Jede Person kann über das{" "}
          <a href="/abuse" className="underline">
            Meldeformular
          </a>{" "}
          Inhalte melden, die sie für rechtswidrig hält (Art. 16 DSA). Der
          Betreiber prüft eingehende Meldungen sorgfältig und ohne unnötige
          Verzögerung und teilt dem Melder die Entscheidung mit Begründung mit.
        </p>
        <p>
          Der Betreiber kann Produkte vorübergehend oder dauerhaft aus dem
          Katalog nehmen und Verkäuferkonten sperren, wenn ein hinreichender
          Verdacht auf einen Verstoß gegen diese Bedingungen oder gegen
          geltendes Recht besteht. Der betroffene Verkäufer wird über die
          Maßnahme und ihre Gründe informiert (Art. 17 DSA) und kann dagegen
          Beschwerde erheben.
        </p>
        <p>
          Bei wiederholt missbräuchlichen Angeboten oder wiederholt
          offensichtlich unbegründeten Meldungen kann der Zugang nach
          vorheriger Warnung für einen angemessenen Zeitraum ausgesetzt werden
          (Art. 23 DSA).
        </p>
      </Paragraf>

      <Paragraf nummer={9} titel="Haftung">
        <p>
          Der Betreiber haftet unbeschränkt bei Vorsatz und grober
          Fahrlässigkeit sowie bei der Verletzung von Leben, Körper und
          Gesundheit. Bei einfacher Fahrlässigkeit haftet er nur bei Verletzung
          einer wesentlichen Vertragspflicht, deren Erfüllung die
          ordnungsgemäße Durchführung des Vertrags überhaupt erst ermöglicht und
          auf deren Einhaltung der Nutzer regelmäßig vertrauen darf; in diesem
          Fall ist die Haftung auf den vertragstypischen, vorhersehbaren Schaden
          begrenzt.
        </p>
        <p>
          Für Inhalte, Rechtmäßigkeit und Mängelfreiheit der von Verkäufern
          eingestellten Produkte haftet der Betreiber nicht. Er ist nicht
          verpflichtet, die übermittelten Inhalte allgemein zu überwachen
          (Art. 8 DSA). Ab Kenntnis eines rechtswidrigen Inhalts wird er
          unverzüglich tätig.
        </p>
        <p>
          Der Betreiber schuldet keine ununterbrochene Verfügbarkeit des
          Marktplatzes. Wartungsarbeiten und Störungen begründen keinen
          Schadensersatzanspruch, soweit nicht Vorsatz oder grobe
          Fahrlässigkeit vorliegt.
        </p>
      </Paragraf>

      <Paragraf nummer={10} titel="Freistellung">
        <p>
          Der Verkäufer stellt den Betreiber von allen Ansprüchen Dritter frei,
          die diese wegen der von ihm eingestellten Inhalte oder wegen der
          Verletzung seiner Pflichten aus diesen Bedingungen gegen den Betreiber
          geltend machen. Dies umfasst auch die notwendigen Kosten einer
          Rechtsverteidigung.
        </p>
      </Paragraf>

      <Paragraf nummer={11} titel="Laufzeit und Kündigung">
        <p>
          Das Nutzungsverhältnis für Verkäufer läuft auf unbestimmte Zeit und
          kann von beiden Seiten jederzeit mit einer Frist von vierzehn Tagen
          gekündigt werden. Das Recht zur außerordentlichen Kündigung aus
          wichtigem Grund bleibt unberührt.
        </p>
        <p>
          Bereits geschlossene Kaufverträge bleiben von einer Kündigung
          unberührt; der Verkäufer bleibt zur Erfüllung verpflichtet.
        </p>
      </Paragraf>

      <Paragraf nummer={12} titel="Änderungen dieser Bedingungen">
        <p>
          Der Betreiber kann diese Bedingungen mit Wirkung für die Zukunft
          ändern. Verkäufer werden über Änderungen mindestens dreißig Tage vor
          Inkrafttreten per E-Mail informiert. Widerspricht ein Verkäufer nicht
          innerhalb dieser Frist, gelten die Änderungen als angenommen; auf
          diese Folge wird in der Mitteilung gesondert hingewiesen. Im Fall des
          Widerspruchs kann jede Seite das Nutzungsverhältnis kündigen.
        </p>
      </Paragraf>

      <Paragraf nummer={13} titel="Schlussbestimmungen">
        <p>
          Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts. Bei
          Verbrauchern gilt diese Rechtswahl nur, soweit dadurch der Schutz
          zwingender Vorschriften des Staates ihres gewöhnlichen Aufenthalts
          nicht entzogen wird.
        </p>
        <p>
          Ist der Nutzer Kaufmann, juristische Person des öffentlichen Rechts
          oder öffentlich-rechtliches Sondervermögen, ist Gerichtsstand der Sitz
          des Betreibers.
        </p>
        <p>
          Sollte eine Bestimmung unwirksam sein oder werden, bleibt die
          Wirksamkeit der übrigen Bestimmungen unberührt.
        </p>
      </Paragraf>

      <p className="mt-10 text-sm text-neutral-500">
        Stand: {BEDINGUNGEN_STAND}
      </p>
    </>
  );
}
