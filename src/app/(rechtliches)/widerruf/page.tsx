import type { Metadata } from "next";

import { Rechtshinweis } from "../hinweis";

export const metadata: Metadata = { title: "Widerrufsbelehrung" };

export default function Seite() {
  return (
    <>
      <Rechtshinweis />

      <h1 className="text-3xl font-semibold tracking-tight">
        Widerrufsbelehrung
      </h1>

      <div className="mt-6 rounded-md border border-blue-300 bg-blue-50 p-4 text-sm text-blue-900">
        <p>
          <strong>Das Wichtigste zuerst.</strong> Auf diesem Marktplatz werden
          ausschließlich digitale Inhalte verkauft, die sofort zum Download
          bereitstehen. Vor dem Kauf musst du ausdrücklich zustimmen, dass die
          Auslieferung sofort beginnt. Mit dieser Zustimmung{" "}
          <strong>erlischt dein Widerrufsrecht</strong> (§ 356 Abs. 5 BGB).
        </p>
        <p className="mt-3">
          Ohne diese Zustimmung ist kein Kauf möglich — dafür bekommst du die
          Datei sofort statt erst nach 14 Tagen.
        </p>
      </div>

      <h2 className="mt-8 text-xl font-semibold">
        Gegenüber wem gilt der Widerruf?
      </h2>
      <p className="text-neutral-800">
        Der Kaufvertrag kommt zwischen dir und dem jeweiligen{" "}
        <strong>Verkäufer</strong> zustande, nicht mit dem Marktplatz. Ein
        Widerruf ist daher gegenüber dem Verkäufer zu erklären. Dessen Angaben
        findest du auf der Produktseite und in deiner Kaufbestätigung. Wir
        leiten deine Erklärung auf Wunsch weiter, wenn du uns nicht erreichst —
        Fristwahrung setzt aber den Zugang beim Verkäufer voraus.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Widerrufsrecht</h2>
      <p className="text-neutral-800">
        Du hast das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen
        Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem
        Tag des Vertragsabschlusses.
      </p>
      <p className="text-neutral-800">
        Um dein Widerrufsrecht auszuüben, musst du dem Verkäufer mittels einer
        eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder eine
        E-Mail) über deinen Entschluss, diesen Vertrag zu widerrufen,
        informieren. Du kannst dafür das unten stehende Muster verwenden, das
        aber nicht vorgeschrieben ist.
      </p>
      <p className="text-neutral-800">
        Zur Wahrung der Widerrufsfrist reicht es aus, dass du die Mitteilung
        über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist
        absendest.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Folgen des Widerrufs</h2>
      <p className="text-neutral-800">
        Wenn du diesen Vertrag widerrufst, hat der Verkäufer dir alle Zahlungen,
        die er von dir erhalten hat, unverzüglich und spätestens binnen
        vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über
        deinen Widerruf dieses Vertrags bei ihm eingegangen ist. Für diese
        Rückzahlung wird dasselbe Zahlungsmittel verwendet, das du bei der
        ursprünglichen Transaktion eingesetzt hast, es sei denn, mit dir wurde
        ausdrücklich etwas anderes vereinbart; in keinem Fall werden dir wegen
        dieser Rückzahlung Entgelte berechnet.
      </p>

      <h2 className="mt-8 text-xl font-semibold">
        Vorzeitiges Erlöschen des Widerrufsrechts
      </h2>
      <p className="text-neutral-800">
        Das Widerrufsrecht erlischt bei einem Vertrag über die Lieferung von
        nicht auf einem körperlichen Datenträger befindlichen digitalen
        Inhalten, wenn
      </p>
      <ol className="ml-5 list-decimal space-y-1 text-neutral-800">
        <li>
          du ausdrücklich zugestimmt hast, dass mit der Ausführung des Vertrags
          vor Ablauf der Widerrufsfrist begonnen wird,
        </li>
        <li>
          du deine Kenntnis davon bestätigt hast, dass du durch deine Zustimmung
          mit Beginn der Ausführung des Vertrags dein Widerrufsrecht verlierst,
          und
        </li>
        <li>
          der Verkäufer dir eine Bestätigung des Vertrags zur Verfügung gestellt
          hat.
        </li>
      </ol>
      <p className="text-neutral-800">
        Alle drei Voraussetzungen liegen bei jedem Kauf über diesen Marktplatz
        vor: Die Zustimmung wird im Kaufformular abgefragt und mit Zeitpunkt zu
        deiner Bestellung gespeichert; die Kaufbestätigung geht dir unmittelbar
        nach der Zahlung per E-Mail zu.
      </p>

      <h2 className="mt-8 text-xl font-semibold">
        Muster-Widerrufsformular
      </h2>
      <p className="text-sm text-neutral-600">
        Wenn du den Vertrag widerrufen willst, fülle dieses Formular aus und
        sende es an den Verkäufer zurück. Die Verwendung ist freiwillig.
      </p>
      <div className="whitespace-pre-line rounded-md border border-neutral-300 bg-neutral-50 p-5 font-mono text-sm text-neutral-800">
        {`An
[Name und Anschrift des Verkäufers, siehe Produktseite und Kaufbestätigung]

Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag
über den Kauf der folgenden Waren (*) / die Erbringung der folgenden
Dienstleistung (*):

  ______________________________________________

Bestellt am (*) / erhalten am (*):  ____________

Name des/der Verbraucher(s):        ____________

Anschrift des/der Verbraucher(s):   ____________

  ______________________________________________

Unterschrift des/der Verbraucher(s)
(nur bei Mitteilung auf Papier)

Datum: ____________

(*) Unzutreffendes streichen.`}
      </div>

      <h2 className="mt-8 text-xl font-semibold">
        Wenn etwas mit der Datei nicht stimmt
      </h2>
      <p className="text-neutral-800">
        Das Erlöschen des Widerrufsrechts betrifft nur den Widerruf. Deine
        gesetzlichen Rechte bei mangelhaften digitalen Produkten (§§ 327 ff.
        BGB) bleiben davon unberührt. Ist eine Datei fehlerhaft, unvollständig
        oder lässt sie sich nicht öffnen, wende dich an den Verkäufer. Führt das
        nicht zum Ziel, hilft dir der Marktplatz weiter.
      </p>
    </>
  );
}
