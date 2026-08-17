import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests für den Stripe-Webhook — laut Auftrag der Teil, bei dem Fehler Geld
 * kosten. Geprüft wird vor allem:
 *
 * - gefälschte Anfragen werden abgewiesen
 * - dieselbe Zahlung erzeugt nur EINE Bestellung (Stripe stellt mehrfach zu)
 * - Provision und Betrag landen unverändert in der Bestellung
 *
 * Supabase wird dabei durch eine Attrappe ersetzt, damit die Tests ohne
 * Datenbank und ohne Netz laufen.
 */

const WEBHOOK_GEHEIMNIS = "whsec_testgeheimnis_fuer_die_tests_1234567890";

/** Sammelt alle Einfügeversuche, damit die Tests sie prüfen können. */
const eingefuegt: Array<Record<string, unknown>> = [];

/** Steuert, ob die Datenbank einen Unique-Konflikt meldet. */
let naechsterFehler: { code: string; message: string } | null = null;

vi.mock("@/lib/supabase/service", () => ({
  supabaseService: () => ({
    from: () => ({
      insert: (zeile: Record<string, unknown>) => {
        eingefuegt.push(zeile);
        const fehler = naechsterFehler;
        naechsterFehler = null;
        return Promise.resolve({ error: fehler });
      },
    }),
  }),
}));

/** Baut eine Signatur genau so, wie Stripe sie mitschickt. */
function signiere(nutzlast: string, geheimnis: string, zeit = Math.floor(Date.now() / 1000)) {
  const signatur = createHmac("sha256", geheimnis)
    .update(`${zeit}.${nutzlast}`)
    .digest("hex");
  return `t=${zeit},v1=${signatur}`;
}

function checkoutEreignis(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    id: "evt_test_1",
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_1",
        payment_status: "paid",
        payment_intent: "pi_test_1",
        amount_total: 1990,
        customer_email: "kaeufer@example.de",
        customer_details: {
          email: "kaeufer@example.de",
          address: { country: "DE" },
        },
        metadata: {
          produkt_id: "11111111-1111-1111-1111-111111111111",
          verkaeufer_id: "22222222-2222-2222-2222-222222222222",
          provision_cent: "398",
          widerruf_verzicht_at: "2026-08-04T20:00:00.000Z",
        },
        ...overrides,
      },
    },
  });
}

async function ladeRoute() {
  vi.resetModules();
  return import("@/app/api/stripe/webhook/route");
}

function anfrage(nutzlast: string, signatur?: string) {
  return new Request("http://localhost:3000/api/stripe/webhook", {
    method: "POST",
    headers: signatur ? { "stripe-signature": signatur } : {},
    body: nutzlast,
  });
}

beforeEach(() => {
  eingefuegt.length = 0;
  naechsterFehler = null;
  process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_GEHEIMNIS;
  process.env.STRIPE_SECRET_KEY = "sk_test_attrappe";
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Signaturprüfung", () => {
  it("weist Anfragen ohne Signatur ab", async () => {
    const { POST } = await ladeRoute();
    const antwort = await POST(anfrage(checkoutEreignis()));

    expect(antwort.status).toBe(400);
    expect(eingefuegt).toHaveLength(0);
  });

  it("weist gefälschte Signaturen ab", async () => {
    const { POST } = await ladeRoute();
    const nutzlast = checkoutEreignis();
    const gefaelscht = signiere(nutzlast, "falsches_geheimnis");

    const antwort = await POST(anfrage(nutzlast, gefaelscht));

    expect(antwort.status).toBe(400);
    // Entscheidend: ohne gültige Signatur entsteht KEINE Bestellung.
    expect(eingefuegt).toHaveLength(0);
  });

  it("weist nachträglich veränderte Nutzlast ab", async () => {
    const { POST } = await ladeRoute();
    const echt = checkoutEreignis();
    const signatur = signiere(echt, WEBHOOK_GEHEIMNIS);

    // Angreifer erhöht den Betrag, behält aber die alte Signatur.
    const manipuliert = echt.replace('"amount_total":1990', '"amount_total":1');
    const antwort = await POST(anfrage(manipuliert, signatur));

    expect(antwort.status).toBe(400);
    expect(eingefuegt).toHaveLength(0);
  });

  it("nimmt korrekt signierte Anfragen an", async () => {
    const { POST } = await ladeRoute();
    const nutzlast = checkoutEreignis();
    const antwort = await POST(anfrage(nutzlast, signiere(nutzlast, WEBHOOK_GEHEIMNIS)));

    expect(antwort.status).toBe(200);
    expect(eingefuegt).toHaveLength(1);
  });
});

describe("Bestellung", () => {
  it("übernimmt Betrag, Provision und Widerrufsverzicht unverändert", async () => {
    const { POST } = await ladeRoute();
    const nutzlast = checkoutEreignis();
    await POST(anfrage(nutzlast, signiere(nutzlast, WEBHOOK_GEHEIMNIS)));

    const bestellung = eingefuegt[0];
    expect(bestellung.betrag_cent).toBe(1990);
    expect(bestellung.provision_cent).toBe(398);
    expect(bestellung.status).toBe("bezahlt");
    expect(bestellung.widerruf_verzicht_at).toBe("2026-08-04T20:00:00.000Z");
    expect(bestellung.stripe_payment_intent).toBe("pi_test_1");
  });

  it("erzeugt einen langen, zufälligen Download-Token mit Ablauf", async () => {
    const { POST } = await ladeRoute();
    const nutzlast = checkoutEreignis();
    await POST(anfrage(nutzlast, signiere(nutzlast, WEBHOOK_GEHEIMNIS)));

    const bestellung = eingefuegt[0];
    expect(String(bestellung.download_token).length).toBeGreaterThanOrEqual(32);
    expect(bestellung.download_zaehler).toBe(0);

    const ablauf = new Date(String(bestellung.token_ablauf)).getTime();
    const stunden = (ablauf - Date.now()) / 3600_000;
    expect(stunden).toBeGreaterThan(71);
    expect(stunden).toBeLessThan(73);
  });

  it("speichert das Käuferland als Nachweis", async () => {
    const { POST } = await ladeRoute();
    const nutzlast = checkoutEreignis();
    await POST(anfrage(nutzlast, signiere(nutzlast, WEBHOOK_GEHEIMNIS)));

    const bestellung = eingefuegt[0];
    expect(bestellung.kaeufer_land).toBe("DE");
    expect(bestellung.kaeufer_land_nachweis).toMatchObject({
      rechnungsland: "DE",
    });
  });

  it("legt bei unbezahlter Sitzung keine Bestellung an", async () => {
    const { POST } = await ladeRoute();
    const nutzlast = checkoutEreignis({ payment_status: "unpaid" });
    const antwort = await POST(anfrage(nutzlast, signiere(nutzlast, WEBHOOK_GEHEIMNIS)));

    expect(antwort.status).toBe(200);
    expect(eingefuegt).toHaveLength(0);
  });
});

describe("Idempotenz", () => {
  it("erzeugt bei doppelt zugestelltem Ereignis nur eine Bestellung", async () => {
    const { POST } = await ladeRoute();
    const nutzlast = checkoutEreignis();
    const signatur = signiere(nutzlast, WEBHOOK_GEHEIMNIS);

    const erste = await POST(anfrage(nutzlast, signatur));
    expect(erste.status).toBe(200);

    // Stripe stellt erneut zu. Die Datenbank meldet den Unique-Konflikt auf
    // stripe_payment_intent — genau das ist der Schutz.
    naechsterFehler = { code: "23505", message: "duplicate key value" };
    const zweite = await POST(anfrage(nutzlast, signatur));

    // Wichtig: 200, nicht 500. Sonst versucht Stripe es endlos erneut.
    expect(zweite.status).toBe(200);
  });

  it("meldet echte Datenbankfehler als 500, damit Stripe erneut zustellt", async () => {
    const { POST } = await ladeRoute();
    const nutzlast = checkoutEreignis();

    naechsterFehler = { code: "08006", message: "connection failure" };
    const antwort = await POST(anfrage(nutzlast, signiere(nutzlast, WEBHOOK_GEHEIMNIS)));

    expect(antwort.status).toBe(500);
  });
});
