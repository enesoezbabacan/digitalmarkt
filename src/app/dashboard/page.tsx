import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { formatEuro, provisionCent, verkaeuferAnteilCent } from "@/lib/geld";
import { angemeldeteVerkaeuferId } from "@/lib/sitzung";
import { dsaAngabenVollstaendig } from "@/lib/validation/verkaeufer";
import { abmelden, zurPruefungEinreichen } from "./aktionen";
import { ProduktFormular } from "./produkt-formular";
import { stripeOnboardingStarten } from "./stripe-aktionen";
import { stripeStatusLaden } from "./stripe-status";

export const metadata: Metadata = { title: "Verkäufer-Bereich" };

const STATUS_TEXT: Record<string, string> = {
  draft: "Entwurf",
  review: "In Prüfung",
  live: "Im Katalog",
  removed: "Entfernt",
};

export default async function Dashboard() {
  const id = await angemeldeteVerkaeuferId();
  if (!id) redirect("/anmelden");

  const verkaeufer = await db().verkaeufer(id);
  // Zeigt das Cookie auf einen Verkäufer, den es nicht mehr gibt, muss es
  // gelöscht werden. Das geht nicht hier, sondern nur im Route Handler.
  if (!verkaeufer) redirect("/abmelden");

  // Alle Abfragen sind an die eigene Verkäufer-ID gebunden. Fremde Produkte
  // und Bestellungen sind dadurch nicht erreichbar.
  const [produkte, bestellungen, stripeStatus] = await Promise.all([
    db().eigeneProdukte(verkaeufer.id),
    db().eigeneBestellungen(verkaeufer.id),
    stripeStatusLaden(verkaeufer.stripe_account_id),
  ]);

  const pruefung = dsaAngabenVollstaendig(verkaeufer);
  const umsatz = bestellungen.reduce((summe, b) => summe + b.betrag_cent, 0);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Verkäufer-Bereich
          </h1>
          <p className="mt-1 text-neutral-600">
            Angemeldet als {verkaeufer.name} ({verkaeufer.email})
          </p>
        </div>
        <form action={abmelden}>
          <button
            type="submit"
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-100"
          >
            Abmelden
          </button>
        </form>
      </div>

      {!stripeStatus.verbunden && (
        <div className="mt-6 rounded-md border border-blue-300 bg-blue-50 p-4 text-sm text-blue-900">
          <p>
            Bevor du Geld empfangen kannst, musst du dich bei Stripe
            verifizieren — Ausweis, Gewerbeanmeldung und Bankverbindung.
            Produkte kannst du schon jetzt als Entwurf anlegen.
          </p>
          <form action={stripeOnboardingStarten} className="mt-3">
            <button
              type="submit"
              className="rounded-md bg-blue-900 px-4 py-2 font-medium text-white hover:bg-blue-800"
            >
              Jetzt bei Stripe verifizieren
            </button>
          </form>
        </div>
      )}

      {stripeStatus.verbunden && !stripeStatus.auszahlungBereit && (
        <div className="mt-6 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p>
            Deine Stripe-Verifizierung ist noch nicht abgeschlossen
            {stripeStatus.offenePunkte.length > 0 &&
              ` — offen: ${stripeStatus.offenePunkte.join(", ")}`}
            . Bis dahin kannst du keine Auszahlungen empfangen.
          </p>
          <form action={stripeOnboardingStarten} className="mt-3">
            <button
              type="submit"
              className="rounded-md border border-amber-900 px-4 py-2 font-medium text-amber-900 hover:bg-amber-100"
            >
              Verifizierung fortsetzen
            </button>
          </form>
        </div>
      )}

      {stripeStatus.verbunden && stripeStatus.auszahlungBereit && (
        <p className="mt-6 rounded-md border border-green-300 bg-green-50 p-4 text-sm text-green-900">
          Deine Stripe-Verifizierung ist abgeschlossen. Auszahlungen sind
          aktiv.
        </p>
      )}

      {verkaeufer.ust_id && (
        <p className="mt-4 text-sm text-neutral-600">
          USt-IdNr. {verkaeufer.ust_id} — Prüfung gegen die EU-Datenbank:{" "}
          <strong>
            {verkaeufer.ust_id_pruefergebnis === "gueltig" && "gültig"}
            {verkaeufer.ust_id_pruefergebnis === "ungueltig" && "ungültig"}
            {(verkaeufer.ust_id_pruefergebnis === "unbekannt" ||
              !verkaeufer.ust_id_pruefergebnis) &&
              "noch offen (EU-Dienst war nicht erreichbar)"}
          </strong>
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_24rem]">
        <section>
          <h2 className="text-xl font-semibold">Deine Produkte</h2>

          {produkte.length === 0 ? (
            <p className="mt-3 rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-500">
              Du hast noch keine Produkte angelegt.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {produkte.map((produkt) => (
                <li
                  key={produkt.id}
                  className="rounded-lg border border-neutral-200 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-medium">{produkt.titel}</h3>
                      <p className="mt-1 text-sm text-neutral-500">
                        {produkt.kategorie} · {STATUS_TEXT[produkt.status]}
                        {produkt.datei_name && ` · ${produkt.datei_name}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatEuro(produkt.preis_cent)}
                      </p>
                      <p className="text-xs text-neutral-500">
                        du bekommst{" "}
                        {formatEuro(verkaeuferAnteilCent(produkt.preis_cent))}
                        {", "}
                        Provision {formatEuro(provisionCent(produkt.preis_cent))}
                      </p>
                    </div>
                  </div>

                  {produkt.status === "draft" && (
                    <form action={zurPruefungEinreichen} className="mt-3">
                      <input type="hidden" name="produkt_id" value={produkt.id} />
                      <button
                        type="submit"
                        className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100"
                      >
                        Zur Prüfung einreichen
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}

          <h2 className="mt-10 text-xl font-semibold">Deine Verkäufe</h2>
          <p className="mt-3 rounded-lg border border-neutral-200 p-4 text-sm text-neutral-600">
            {bestellungen.length === 0
              ? "Noch keine Verkäufe. Sobald die Zahlungsabwicklung in Phase 2 steht, erscheinen sie hier."
              : `${bestellungen.length} Verkäufe, Umsatz ${formatEuro(umsatz)}.`}
          </p>
        </section>

        <section className="h-fit rounded-lg border border-neutral-200 p-5">
          <h2 className="text-xl font-semibold">Neues Produkt</h2>
          <p className="mt-1 mb-4 text-sm text-neutral-600">
            Neue Produkte werden als Entwurf gespeichert und erscheinen erst
            nach Freigabe im Katalog.
          </p>
          <ProduktFormular
            gesperrt={
              pruefung.ok
                ? undefined
                : "Deine Verkäuferangaben sind unvollständig. Es fehlt: " +
                  pruefung.fehlend.join(", ") +
                  ". Ohne diese gesetzlich vorgeschriebenen Angaben kannst du keine Produkte einstellen."
            }
          />
        </section>
      </div>
    </div>
  );
}
