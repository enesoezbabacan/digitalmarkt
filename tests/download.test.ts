import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests für die Download-Auslieferung.
 *
 * Der Token ist der einzige Schlüssel zur bezahlten Datei — es gibt keine
 * Anmeldung für Käufer. Deshalb muss jede einzelne Grenze halten:
 * Ablaufzeit, Abrufzähler, Sperre nach Erstattung.
 */

type Bestellung = {
  id: string;
  product_id: string;
  token_ablauf: string | null;
  download_zaehler: number;
  status: string;
};

let bestellung: Bestellung | null = null;
let signaturSchlaegtFehl = false;
let zaehlerNeu: number | null = null;
let dateiPfad: string | null = "verkaeufer/produkt.pdf";

vi.mock("@/lib/supabase/service", () => ({
  supabaseService: () => ({
    from: (tabelle: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data:
                tabelle === "orders"
                  ? bestellung
                  : dateiPfad
                    ? { datei_pfad: dateiPfad, datei_name: "produkt.pdf" }
                    : null,
            }),
        }),
      }),
      update: (werte: { download_zaehler: number }) => ({
        eq: () => {
          zaehlerNeu = werte.download_zaehler;
          return Promise.resolve({ error: null });
        },
      }),
    }),
    storage: {
      from: () => ({
        createSignedUrl: () =>
          Promise.resolve(
            signaturSchlaegtFehl
              ? { data: null, error: { message: "storage down" } }
              : {
                  data: { signedUrl: "https://supabase.example/signiert?token=abc" },
                  error: null,
                },
          ),
      }),
    },
  }),
}));

const GUELTIGER_TOKEN = "a".repeat(43);

function inStunden(stunden: number) {
  return new Date(Date.now() + stunden * 3600_000).toISOString();
}

async function abrufen(token = GUELTIGER_TOKEN) {
  vi.resetModules();
  const { GET } = await import("@/app/download/[token]/route");
  return GET(new Request(`http://localhost:3000/download/${token}`), {
    params: Promise.resolve({ token }),
  });
}

beforeEach(() => {
  zaehlerNeu = null;
  signaturSchlaegtFehl = false;
  dateiPfad = "verkaeufer/produkt.pdf";
  bestellung = {
    id: "bestellung-1",
    product_id: "produkt-1",
    token_ablauf: inStunden(48),
    download_zaehler: 0,
    status: "bezahlt",
  };
});

describe("gültiger Download", () => {
  it("leitet auf eine signierte Adresse weiter", async () => {
    const antwort = await abrufen();

    expect(antwort.status).toBe(307);
    expect(antwort.headers.get("location")).toContain("supabase.example");
  });

  it("zählt den Abruf hoch", async () => {
    bestellung!.download_zaehler = 2;
    await abrufen();

    expect(zaehlerNeu).toBe(3);
  });
});

describe("Grenzen", () => {
  it("weist einen abgelaufenen Token ab", async () => {
    bestellung!.token_ablauf = inStunden(-1);
    const antwort = await abrufen();

    expect(antwort.status).toBe(410);
    expect(await antwort.text()).toContain("abgelaufen");
    expect(zaehlerNeu).toBeNull();
  });

  it("weist ab, sobald fünf Abrufe verbraucht sind", async () => {
    bestellung!.download_zaehler = 5;
    const antwort = await abrufen();

    expect(antwort.status).toBe(429);
    expect(zaehlerNeu).toBeNull();
  });

  it("erlaubt den fünften Abruf noch", async () => {
    bestellung!.download_zaehler = 4;
    const antwort = await abrufen();

    expect(antwort.status).toBe(307);
    expect(zaehlerNeu).toBe(5);
  });

  it("sperrt den Download nach einer Erstattung", async () => {
    bestellung!.status = "erstattet";
    const antwort = await abrufen();

    expect(antwort.status).toBe(403);
    expect(zaehlerNeu).toBeNull();
  });

  it("verrät nicht, ob ein Token existiert", async () => {
    bestellung = null;
    const antwort = await abrufen();

    expect(antwort.status).toBe(404);
    // Gleiche Meldung wie bei abgelaufenen Tokens — sonst ließe sich durch
    // Ausprobieren herausfinden, welche Tokens es gibt.
    expect(await antwort.text()).toContain("ungültig oder abgelaufen");
  });

  it("weist offensichtlich zu kurze Tokens sofort ab", async () => {
    const antwort = await abrufen("kurz");

    expect(antwort.status).toBe(400);
  });
});

describe("Fehlerfälle", () => {
  it("verbraucht keinen Abruf, wenn die Datei nicht bereitgestellt werden kann", async () => {
    signaturSchlaegtFehl = true;
    const antwort = await abrufen();

    expect(antwort.status).toBe(500);
    // Entscheidend: ein technischer Fehler darf dem Käufer keinen seiner
    // fünf Abrufe wegnehmen.
    expect(zaehlerNeu).toBeNull();
  });

  it("meldet sauber, wenn zum Produkt keine Datei hinterlegt ist", async () => {
    dateiPfad = null;
    const antwort = await abrufen();

    expect(antwort.status).toBe(500);
    expect(zaehlerNeu).toBeNull();
  });
});
