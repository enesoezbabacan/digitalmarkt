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
        <header className="sticky top-0 z-40 border-b border-neutral-200/80 bg-white/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
            <Link
              href="/"
              className="text-[1.05rem] font-semibold tracking-[-0.01em]"
            >
              Digitalmarkt
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link
                href="/dashboard"
                className="rounded-full px-4 py-2 font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
              >
                Verkäufer-Bereich
              </Link>
              <Link
                href="/registrieren"
                className="ml-1 rounded-full bg-neutral-900 px-4 py-2 font-medium text-white transition hover:bg-neutral-700"
              >
                Verkäufer werden
              </Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
          {children}
        </main>

        <footer className="mt-20 border-t border-neutral-200 bg-neutral-50">
          <div className="mx-auto max-w-6xl px-5 py-10 text-sm text-neutral-500">
            <nav className="flex flex-wrap gap-x-6 gap-y-2">
              {footerLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="transition hover:text-neutral-900"
                >
                  {link.text}
                </Link>
              ))}
            </nav>
            <p className="mt-5 text-xs text-neutral-400">
              Die angebotenen Produkte stammen von unabhängigen Verkäufern. Wir
              machen uns diese Inhalte nicht zu eigen.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
