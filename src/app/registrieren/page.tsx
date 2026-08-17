import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { angemeldeteVerkaeuferId } from "@/lib/sitzung";
import { PROVISION_PROZENT } from "@/lib/geld";
import { RegistrierungsFormular } from "./formular";

export const metadata: Metadata = { title: "Verkäufer werden" };

export default async function Registrieren() {
  // Nur weiterleiten, wenn der Verkäufer wirklich existiert. Sonst landet man
  // mit einem veralteten Cookie in einer Weiterleitungsschleife.
  const id = await angemeldeteVerkaeuferId();
  if (id && (await db().verkaeufer(id))) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-semibold tracking-tight">Verkäufer werden</h1>
      <p className="mt-2 text-neutral-600">
        Stelle deine digitalen Produkte ein. Wir behalten{" "}
        {PROVISION_PROZENT} % Provision pro Verkauf, der Rest geht direkt an dich.
      </p>

      <div className="mt-8 rounded-lg border border-neutral-200 p-6">
        <RegistrierungsFormular />
      </div>

      <p className="mt-6 text-sm text-neutral-600">
        Du hast schon ein Konto?{" "}
        <Link href="/anmelden" className="font-medium underline">
          Hier anmelden
        </Link>
      </p>
    </div>
  );
}
