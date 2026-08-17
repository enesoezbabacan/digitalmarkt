import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { angemeldeteVerkaeuferId } from "@/lib/sitzung";
import { PasswortFormular } from "./formular";

export const metadata: Metadata = { title: "Neues Passwort" };

export const dynamic = "force-dynamic";

export default async function PasswortNeu() {
  // Ohne Sitzung gibt es hier nichts zu tun. Das passiert, wenn der
  // Wiederherstellungslink abgelaufen ist oder schon benutzt wurde.
  const id = await angemeldeteVerkaeuferId();
  if (!id) redirect("/anmelden?fehler=1");

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold tracking-tight">Neues Passwort</h1>
      <p className="mt-2 text-neutral-600">
        Vergib jetzt ein neues Passwort für dein Konto. Danach bist du
        angemeldet.
      </p>
      <PasswortFormular />
    </div>
  );
}
