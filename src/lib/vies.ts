/**
 * Prüfung der USt-IdNr. gegen die EU-Datenbank VIES.
 *
 * Hintergrund: Art. 30 Abs. 2 DSA verlangt von Marktplätzen "zumutbare
 * Anstrengungen", die Angaben ihrer Verkäufer zu überprüfen — es reicht nicht,
 * die Daten nur abzufragen. Diese Prüfung ist kostenlos und braucht kein Konto.
 *
 * Wichtig: VIES ist ein Behördendienst mit unzuverlässiger Verfügbarkeit.
 * Ein Ausfall darf eine Registrierung NIE blockieren — sonst sperrt uns eine
 * fremde Störung die eigenen Verkäufer aus. Wir protokollieren dann "unbekannt"
 * und können später erneut prüfen.
 */

const VIES_BASIS = "https://ec.europa.eu/taxation_customs/vies/rest-api";
const ZEITLIMIT_MS = 8000;

export type ViesStatus = "gueltig" | "ungueltig" | "unbekannt";

export type ViesErgebnis = {
  status: ViesStatus;
  /** Von VIES zurückgemeldeter Firmenname, sofern das Land ihn herausgibt. */
  name?: string;
  /** Von VIES zurückgemeldete Anschrift, sofern verfügbar. */
  adresse?: string;
  /** Grund, falls der Status "unbekannt" ist — für die Fehlersuche. */
  hinweis?: string;
  geprueftAm: string;
};

/** Zerlegt "DE123456789" in Länderkürzel und Nummer. */
export function zerlegeUstId(
  ustId: string,
): { land: string; nummer: string } | null {
  const bereinigt = ustId.toUpperCase().replace(/[\s.-]/g, "");
  const treffer = /^([A-Z]{2})([A-Z0-9]{2,12})$/.exec(bereinigt);
  if (!treffer) return null;
  return { land: treffer[1], nummer: treffer[2] };
}

export async function pruefeUstId(ustId: string): Promise<ViesErgebnis> {
  const geprueftAm = new Date().toISOString();
  const teile = zerlegeUstId(ustId);

  if (!teile) {
    return {
      status: "ungueltig",
      hinweis: "Format entspricht keiner USt-IdNr.",
      geprueftAm,
    };
  }

  const abbruch = AbortSignal.timeout(ZEITLIMIT_MS);

  try {
    const antwort = await fetch(
      `${VIES_BASIS}/ms/${teile.land}/vat/${teile.nummer}`,
      { signal: abbruch, headers: { Accept: "application/json" } },
    );

    if (!antwort.ok) {
      return {
        status: "unbekannt",
        hinweis: `VIES antwortete mit Status ${antwort.status}.`,
        geprueftAm,
      };
    }

    const daten = (await antwort.json()) as {
      isValid?: boolean;
      name?: string;
      address?: string;
      userError?: string;
    };

    // VIES meldet Dienststörungen als userError, nicht als HTTP-Fehler.
    if (daten.userError && daten.userError !== "VALID" && daten.userError !== "INVALID") {
      return {
        status: "unbekannt",
        hinweis: `VIES meldet: ${daten.userError}`,
        geprueftAm,
      };
    }

    if (daten.isValid === true) {
      return {
        status: "gueltig",
        // Manche Länder geben aus Datenschutzgründen "---" statt eines Namens zurück.
        name: daten.name && daten.name !== "---" ? daten.name : undefined,
        adresse:
          daten.address && daten.address !== "---" ? daten.address : undefined,
        geprueftAm,
      };
    }

    if (daten.isValid === false) {
      return { status: "ungueltig", geprueftAm };
    }

    return {
      status: "unbekannt",
      hinweis: "VIES lieferte keine verwertbare Antwort.",
      geprueftAm,
    };
  } catch (fehler) {
    const grund =
      fehler instanceof Error && fehler.name === "TimeoutError"
        ? "Zeitüberschreitung"
        : "Dienst nicht erreichbar";
    return { status: "unbekannt", hinweis: `VIES: ${grund}.`, geprueftAm };
  }
}
