import { NextResponse } from "next/server";

import { istAdmin } from "@/lib/admin";
import { rechnungPdf, rechnungSicherstellen } from "@/lib/rechnung";

/**
 * Liefert die Provisionsrechnung zu einer Bestellung als PDF.
 *
 * Beim ersten Abruf wird die Rechnung angelegt und ihre Nummer dauerhaft
 * festgeschrieben; jeder weitere Abruf liefert dieselbe Rechnung. Das PDF
 * selbst wird jedes Mal neu erzeugt — aus unveränderlichen Daten, also immer
 * identisch.
 *
 * Zugang nur für den Betreiber. Ohne diese Prüfung könnte jeder mit einer
 * erratenen Bestell-Kennung fremde Verkäuferanschriften und Umsätze abrufen.
 */
export async function GET(
  _anfrage: Request,
  kontext: { params: Promise<{ bestellung: string }> },
) {
  if (!(await istAdmin())) {
    return new NextResponse("Nicht gefunden", { status: 404 });
  }

  const { bestellung } = await kontext.params;

  try {
    const rechnung = await rechnungSicherstellen(bestellung);
    const pdf = await rechnungPdf(rechnung);

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        // inline: öffnet im Browser statt sofort zu laden — praktischer, wenn
        // man nur kurz nachsehen will.
        "Content-Disposition": `inline; filename="Provisionsrechnung-${rechnung.nummer}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (fehler) {
    const text = fehler instanceof Error ? fehler.message : "Unbekannter Fehler";
    return new NextResponse(`Die Rechnung konnte nicht erstellt werden: ${text}`, {
      status: 500,
    });
  }
}
