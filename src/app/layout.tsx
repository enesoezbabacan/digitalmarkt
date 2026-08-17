import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { basisUrl, suchmaschinenErlaubt } from "@/lib/seo";

export const metadata: Metadata = {
  // Ohne metadataBase erzeugt Next.js relative Adressen in den
  // Open-Graph-Angaben. Beim Teilen eines Links wären sie wertlos.
  metadataBase: new URL(basisUrl()),
  title: {
    default: "Digitalmarkt — Marktplatz für digitale Produkte",
    template: "%s | Digitalmarkt",
  },
  description:
    "Marktplatz für digitale Produkte: E-Books, Vorlagen, Presets und Kurse. Sofortiger Download nach dem Kauf.",
  openGraph: { type: "website", locale: "de_DE", siteName: "Digitalmarkt" },
  // Zweite Sperre neben der robots.txt: Solange die Seite nicht freigegeben
  // ist, trägt jede Seite zusätzlich ein noindex im Kopf. Die robots.txt
  // allein verhindert nur das Abrufen — nicht, dass eine Adresse in den Index
  // kommt, die eine Suchmaschine anderswo verlinkt gefunden hat.
  robots: suchmaschinenErlaubt() ? undefined : { index: false, follow: false },
};

const footerLinks = [
  { href: "/impressum", text: "Impressum" },
  { href: "/datenschutz", text: "Datenschutz" },
  { href: "/agb", text: "AGB" },
  { href: "/verkaeufervertrag", text: "Verkäufervertrag" },
  { href: "/widerruf", text: "Widerruf" },
  { href: "/abuse", text: "Rechtsverletzung melden" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-white text-neutral-900">
        <header className="border-b border-neutral-200">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Digitalmarkt
            </Link>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/dashboard"
                className="rounded-md px-3 py-2 text-neutral-700 hover:bg-neutral-100"
              >
                Verkäufer-Bereich
              </Link>
              <Link
                href="/registrieren"
                className="rounded-md bg-neutral-900 px-3 py-2 font-medium text-white hover:bg-neutral-700"
              >
                Verkäufer werden
              </Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
          {children}
        </main>

        <footer className="mt-16 border-t border-neutral-200 bg-neutral-50">
          <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-neutral-600">
            <nav className="flex flex-wrap gap-x-6 gap-y-2">
              {footerLinks.map((link) => (
                <Link key={link.href} href={link.href} className="hover:underline">
                  {link.text}
                </Link>
              ))}
            </nav>
            <p className="mt-4 text-xs text-neutral-500">
              Die angebotenen Produkte stammen von unabhängigen Verkäufern. Wir
              machen uns diese Inhalte nicht zu eigen.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
