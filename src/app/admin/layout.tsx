import { notFound } from "next/navigation";

import { istAdmin } from "@/lib/admin";

/**
 * Zugangssperre für alles unter /admin.
 *
 * Bewusst notFound() statt einer Weiterleitung zur Anmeldung: Wer nicht
 * Betreiber ist, soll nicht einmal erfahren, dass es diesen Bereich gibt.
 *
 * Diese Prüfung ist die erste von zwei Schichten — jede Datenfunktion in
 * lib/db/admin.ts prüft zusätzlich selbst.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await istAdmin())) notFound();
  return children;
}
