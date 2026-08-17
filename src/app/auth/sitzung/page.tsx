import type { Metadata } from "next";

import { sicheresZiel } from "@/lib/weiterleitung";
import { Uebernehmen } from "./uebernehmen";

export const metadata: Metadata = { title: "Anmeldung", robots: { index: false } };

export default async function AuthSitzung({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const werte = await searchParams;
  const roh = werte.next;
  const ziel = sicheresZiel(typeof roh === "string" ? roh : null);

  return <Uebernehmen ziel={ziel} />;
}
