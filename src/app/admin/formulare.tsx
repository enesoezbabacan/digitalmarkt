"use client";

import { useActionState } from "react";

import type { AdminZustand } from "./aktionen";
import {
  meldungAendern,
  produktStatusAendern,
  verkaeuferStatusAendern,
} from "./aktionen";

/**
 * Kleine Formulare für die Admin-Listen.
 *
 * Jede Zeile bekommt ihr eigenes Formular mit eigenem Zustand, damit eine
 * Fehlermeldung dort steht, wo sie hingehört — und nicht oben auf der Seite,
 * wo unklar bliebe, welche Zeile gemeint ist.
 */

const LEER: AdminZustand = {};

function Rueckmeldung({ zustand }: { zustand: AdminZustand }) {
  if (zustand.fehler) {
    return (
      <p className="mt-2 text-sm text-red-700" role="alert">
        {zustand.fehler}
      </p>
    );
  }
  if (zustand.erfolg) {
    return <p className="mt-2 text-sm text-green-700">{zustand.erfolg}</p>;
  }
  return null;
}

function Knopf({
  children,
  laeuft,
  betont,
}: {
  children: React.ReactNode;
  laeuft: boolean;
  betont?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={laeuft}
      className={
        "rounded-md px-3 py-1.5 text-sm disabled:opacity-50 " +
        (betont
          ? "bg-neutral-900 font-medium text-white hover:bg-neutral-700"
          : "border border-neutral-300 hover:bg-neutral-100")
      }
    >
      {children}
    </button>
  );
}

export function ProduktStatusKnoepfe({
  produktId,
  status,
}: {
  produktId: string;
  status: string;
}) {
  const [zustand, absenden, laeuft] = useActionState(
    produktStatusAendern,
    LEER,
  );

  // Nur die Übergänge anbieten, die von hier aus sinnvoll sind.
  const ziele =
    status === "live"
      ? [{ wert: "removed", text: "Aus dem Katalog nehmen" }]
      : [
          { wert: "live", text: "Freigeben" },
          { wert: "removed", text: "Ablehnen" },
        ];

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {ziele.map((ziel) => (
          <form key={ziel.wert} action={absenden}>
            <input type="hidden" name="produkt_id" value={produktId} />
            <input type="hidden" name="status" value={ziel.wert} />
            <Knopf laeuft={laeuft} betont={ziel.wert === "live"}>
              {ziel.text}
            </Knopf>
          </form>
        ))}
      </div>
      <Rueckmeldung zustand={zustand} />
    </div>
  );
}

export function VerkaeuferStatusKnoepfe({
  verkaeuferId,
  status,
}: {
  verkaeuferId: string;
  status: string;
}) {
  const [zustand, absenden, laeuft] = useActionState(
    verkaeuferStatusAendern,
    LEER,
  );

  const ziel =
    status === "suspended"
      ? { wert: "active", text: "Sperre aufheben" }
      : { wert: "suspended", text: "Sperren" };

  return (
    <div>
      <form action={absenden}>
        <input type="hidden" name="verkaeufer_id" value={verkaeuferId} />
        <input type="hidden" name="status" value={ziel.wert} />
        <Knopf laeuft={laeuft}>{ziel.text}</Knopf>
      </form>
      <Rueckmeldung zustand={zustand} />
    </div>
  );
}

export function MeldungFormular({
  meldungId,
  notizen,
}: {
  meldungId: string;
  notizen: string | null;
}) {
  const [zustand, absenden, laeuft] = useActionState(meldungAendern, LEER);

  return (
    <div>
      <form action={absenden} className="mt-3 space-y-2">
        <input type="hidden" name="meldung_id" value={meldungId} />
        <textarea
          name="notizen"
          rows={2}
          defaultValue={notizen ?? ""}
          placeholder="Notiz zur Bearbeitung (was wurde geprüft, was wurde entschieden)"
          className="w-full rounded-md border border-neutral-300 p-2 text-sm"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            name="status"
            value="geprueft"
            disabled={laeuft}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 disabled:opacity-50"
          >
            In Bearbeitung
          </button>
          <button
            type="submit"
            name="status"
            value="erledigt"
            disabled={laeuft}
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
          >
            Erledigt
          </button>
          <button
            type="submit"
            name="status"
            value="abgelehnt"
            disabled={laeuft}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 disabled:opacity-50"
          >
            Abgelehnt
          </button>
        </div>
      </form>
      <Rueckmeldung zustand={zustand} />
    </div>
  );
}
