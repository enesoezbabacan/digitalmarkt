import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "E-Mail bestätigen" };

export default function Bestaetigen() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-3xl font-semibold tracking-tight">
        Fast geschafft
      </h1>

      <p className="mt-4 text-neutral-700">
        Dein Konto ist angelegt. Wir haben dir eine E-Mail geschickt — klick auf
        den Link darin, um deine Adresse zu bestätigen.
      </p>

      <p className="mt-4 text-neutral-700">
        Erst danach kannst du dich anmelden und Produkte einstellen. Das ist
        keine Schikane: Wir müssen sicher sein, dass wir dich erreichen können,
        bevor du hier etwas verkaufst.
      </p>

      <p className="mt-6 text-sm text-neutral-500">
        Keine Mail bekommen? Schau im Spam-Ordner nach. Sie kann ein bis zwei
        Minuten brauchen.
      </p>

      <Link
        href="/anmelden"
        className="mt-8 inline-block rounded-md bg-neutral-900 px-4 py-3 font-medium text-white hover:bg-neutral-700"
      >
        Zur Anmeldung
      </Link>
    </div>
  );
}
