import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { angemeldeteVerkaeuferId, sitzungSetzen } from "@/lib/sitzung";

export const metadata: Metadata = { title: "Anmelden" };

async function anmelden(formular: FormData) {
  "use server";

  const email = (formular.get("email") ?? "").toString().trim();
  const passwort = (formular.get("passwort") ?? "").toString();

  const verkaeufer = await db().verkaeuferPerLogin(email, passwort);

  // Bewusst dieselbe Meldung für "E-Mail unbekannt" und "Passwort falsch" —
  // sonst lässt sich darüber herausfinden, wer hier ein Konto hat.
  if (!verkaeufer) {
    redirect("/anmelden?fehler=1");
  }

  await sitzungSetzen(verkaeufer.id);
  redirect("/dashboard");
}

export default async function Anmelden({ searchParams }: PageProps<"/anmelden">) {
  const id = await angemeldeteVerkaeuferId();
  if (id && (await db().verkaeufer(id))) redirect("/dashboard");
  const { fehler } = await searchParams;

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-3xl font-semibold tracking-tight">Anmelden</h1>

      <form action={anmelden} className="mt-8 space-y-4">
        {fehler && (
          <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
            E-Mail-Adresse oder Passwort stimmt nicht.
          </p>
        )}

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            E-Mail-Adresse
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="passwort" className="mb-1 block text-sm font-medium">
            Passwort
          </label>
          <input
            id="passwort"
            name="passwort"
            type="password"
            autoComplete="current-password"
            required
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-md bg-neutral-900 px-4 py-3 font-medium text-white hover:bg-neutral-700"
        >
          Anmelden
        </button>
      </form>

      <p className="mt-6 text-sm text-neutral-600">
        Noch kein Konto?{" "}
        <Link href="/registrieren" className="font-medium underline">
          Verkäufer werden
        </Link>
      </p>
    </div>
  );
}
