import type { Metadata } from "next";

import { formatEuro } from "@/lib/geld";
import {
  adminBestellungen,
  adminMeldungen,
  adminProdukte,
  adminVerkaeufer,
  adminZahlen,
} from "@/lib/db/admin";
import {
  MeldungFormular,
  ProduktStatusKnoepfe,
  VerkaeuferStatusKnoepfe,
} from "./formulare";

export const metadata: Metadata = { title: "Betreiber" };

// Immer frisch laden. Ein zwischengespeicherter Admin-Bereich würde
// Freigaben und Sperren verzögert anzeigen.
export const dynamic = "force-dynamic";

const PRODUKT_STATUS: Record<string, string> = {
  draft: "Entwurf",
  review: "Wartet auf Freigabe",
  live: "Im Katalog",
  removed: "Entfernt",
};

const VERKAEUFER_STATUS: Record<string, string> = {
  pending: "Neu",
  active: "Aktiv",
  suspended: "Gesperrt",
};

const BESTELL_STATUS: Record<string, string> = {
  bezahlt: "Bezahlt",
  erstattet: "Erstattet",
  storniert: "Storniert",
};

const MELDUNG_STATUS: Record<string, string> = {
  offen: "Offen",
  geprueft: "In Bearbeitung",
  erledigt: "Erledigt",
  abgelehnt: "Abgelehnt",
};

function datum(wert: string): string {
  return new Date(wert).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function Kachel({ titel, wert, hinweis }: { titel: string; wert: string; hinweis?: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 p-4">
      <p className="text-sm text-neutral-600">{titel}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{wert}</p>
      {hinweis && <p className="mt-1 text-xs text-neutral-500">{hinweis}</p>}
    </div>
  );
}

export default async function Admin() {
  // Der Zugang ist bereits im Layout geprüft; jede dieser Funktionen prüft
  // zusätzlich selbst.
  const [produkte, verkaeufer, bestellungen, meldungen] = await Promise.all([
    adminProdukte(),
    adminVerkaeufer(),
    adminBestellungen(),
    adminMeldungen(),
  ]);

  const zahlen = adminZahlen(produkte, verkaeufer, bestellungen, meldungen);
  const wartend = produkte.filter((p) => p.status === "review");
  const offeneMeldungen = meldungen.filter((m) => m.status === "offen");

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Betreiber</h1>
      <p className="mt-1 text-neutral-600">
        Freigaben, Sperren und Zahlen des Marktplatzes.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kachel
          titel="Deine Provision"
          wert={formatEuro(zahlen.provisionCent)}
          hinweis="aus bezahlten, nicht erstatteten Verkäufen"
        />
        <Kachel
          titel="Umsatz über den Marktplatz"
          wert={formatEuro(zahlen.umsatzCent)}
          hinweis={`${zahlen.verkaeufe} Verkäufe, ${zahlen.erstattungen} Erstattungen`}
        />
        <Kachel
          titel="Produkte im Katalog"
          wert={String(zahlen.produkteLive)}
          hinweis={`${zahlen.produkteWartend} warten auf Freigabe`}
        />
        <Kachel
          titel="Verkäufer"
          wert={String(zahlen.verkaeuferAktiv)}
          hinweis={`${zahlen.meldungenOffen} offene Meldungen`}
        />
      </div>

      {/* ---- Meldungen zuerst: Art. 16 DSA verlangt zeitnahe Bearbeitung ---- */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">
          Meldungen ({offeneMeldungen.length} offen)
        </h2>

        {meldungen.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-neutral-300 p-6 text-center text-neutral-500">
            Keine Meldungen.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {meldungen.map((meldung) => (
              <li
                key={meldung.id}
                className={
                  "rounded-lg border p-4 " +
                  (meldung.status === "offen"
                    ? "border-amber-300 bg-amber-50"
                    : "border-neutral-200")
                }
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium">{meldung.produkt_titel}</h3>
                    <p className="mt-1 text-sm text-neutral-600">
                      {datum(meldung.created_at)} · {meldung.melder_name ?? "ohne Namen"}{" "}
                      · {meldung.melder_email}
                    </p>
                  </div>
                  <span className="text-sm font-medium">
                    {MELDUNG_STATUS[meldung.status]}
                  </span>
                </div>
                <p className="mt-2 text-sm whitespace-pre-line">{meldung.grund}</p>
                <MeldungFormular meldungId={meldung.id} notizen={meldung.notizen} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---- Freigaben ---- */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">
          Wartet auf Freigabe ({wartend.length})
        </h2>

        {wartend.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-neutral-300 p-6 text-center text-neutral-500">
            Nichts zu prüfen.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {wartend.map((produkt) => (
              <li
                key={produkt.id}
                className="rounded-lg border border-neutral-200 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="max-w-2xl">
                    <h3 className="font-medium">{produkt.titel}</h3>
                    <p className="mt-1 text-sm text-neutral-500">
                      {produkt.verkaeufer_name} · {produkt.kategorie} ·{" "}
                      {produkt.datei_name ?? "keine Datei"}
                    </p>
                    <p className="mt-2 text-sm text-neutral-700">
                      {produkt.beschreibung}
                    </p>
                  </div>
                  <p className="font-semibold">{formatEuro(produkt.preis_cent)}</p>
                </div>
                <div className="mt-3">
                  <ProduktStatusKnoepfe
                    produktId={produkt.id}
                    status={produkt.status}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---- Alle Produkte ---- */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Alle Produkte ({produkte.length})</h2>
        <ul className="mt-3 divide-y divide-neutral-200 rounded-lg border border-neutral-200">
          {produkte.map((produkt) => (
            <li
              key={produkt.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div>
                <p className="font-medium">{produkt.titel}</p>
                <p className="mt-1 text-sm text-neutral-500">
                  {produkt.verkaeufer_name} · {PRODUKT_STATUS[produkt.status]} ·{" "}
                  {formatEuro(produkt.preis_cent)}
                </p>
              </div>
              <ProduktStatusKnoepfe
                produktId={produkt.id}
                status={produkt.status}
              />
            </li>
          ))}
        </ul>
      </section>

      {/* ---- Verkäufer ---- */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Verkäufer ({verkaeufer.length})</h2>
        <ul className="mt-3 divide-y divide-neutral-200 rounded-lg border border-neutral-200">
          {verkaeufer.map((v) => (
            <li
              key={v.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div>
                <p className="font-medium">
                  {v.name}{" "}
                  <span className="font-normal text-neutral-500">
                    ({VERKAEUFER_STATUS[v.status]})
                  </span>
                </p>
                <p className="mt-1 text-sm text-neutral-500">
                  {v.email} · {v.strasse}, {v.plz} {v.ort}, {v.land}
                </p>
                <p className="mt-1 text-sm text-neutral-500">
                  Steuernummer {v.steuernummer}
                  {v.ust_id && ` · USt-IdNr. ${v.ust_id} (${v.ust_id_pruefergebnis ?? "ungeprüft"})`}
                  {" · "}
                  {v.stripe_account_id ? "Stripe verbunden" : "kein Stripe-Konto"}
                </p>
              </div>
              <VerkaeuferStatusKnoepfe verkaeuferId={v.id} status={v.status} />
            </li>
          ))}
        </ul>
      </section>

      {/* ---- Bestellungen ---- */}
      <section className="mt-10 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">
            Letzte Bestellungen ({bestellungen.length})
          </h2>
          <a
            href="/admin/export"
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-100"
          >
            Alle als CSV für den Steuerberater
          </a>
        </div>

        {bestellungen.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-neutral-300 p-6 text-center text-neutral-500">
            Noch keine Bestellungen.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-neutral-200">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left">
                <tr>
                  <th className="p-3 font-medium">Datum</th>
                  <th className="p-3 font-medium">Produkt</th>
                  <th className="p-3 font-medium">Verkäufer</th>
                  <th className="p-3 font-medium">Käufer</th>
                  <th className="p-3 text-right font-medium">Betrag</th>
                  <th className="p-3 text-right font-medium">Provision</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Rechnung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {bestellungen.map((b) => (
                  <tr key={b.id}>
                    <td className="p-3 whitespace-nowrap">{datum(b.created_at)}</td>
                    <td className="p-3">{b.produkt_titel}</td>
                    <td className="p-3">{b.verkaeufer_name}</td>
                    <td className="p-3">{b.kaeufer_email}</td>
                    <td className="p-3 text-right whitespace-nowrap">
                      {formatEuro(b.betrag_cent)}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      {formatEuro(b.provision_cent)}
                    </td>
                    <td className="p-3">{BESTELL_STATUS[b.status]}</td>
                    <td className="p-3 whitespace-nowrap">
                      <a
                        href={`/admin/rechnung/${b.id}`}
                        target="_blank"
                        rel="noopener"
                        className="underline hover:no-underline"
                      >
                        PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
