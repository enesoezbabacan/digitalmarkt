"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/lib/db";
import { MAX_PREIS_CENT, MIN_PREIS_CENT, euroStringZuCent, formatEuro } from "@/lib/geld";
import { produktZurPruefungAnBetreiberSenden } from "@/lib/mail";
import { angemeldeteVerkaeuferId, sitzungBeenden } from "@/lib/sitzung";
import { dsaAngabenVollstaendig } from "@/lib/validation/verkaeufer";

export type ProduktZustand = { fehler?: string; erfolg?: string };

/** Maximale Größe einer Produktdatei. */
const MAX_DATEI_BYTES = 50 * 1024 * 1024; // 50 MB

const produktSchema = z.object({
  titel: z
    .string()
    .trim()
    .min(3, "Der Titel muss mindestens 3 Zeichen haben.")
    .max(120, "Der Titel ist zu lang (maximal 120 Zeichen)."),
  beschreibung: z
    .string()
    .trim()
    .min(20, "Bitte beschreibe dein Produkt mit mindestens 20 Zeichen.")
    .max(5000, "Die Beschreibung ist zu lang (maximal 5000 Zeichen)."),
  kategorie: z.string().trim().min(2, "Bitte wähle eine Kategorie."),
});

/**
 * Zentrale Zugangsprüfung.
 *
 * Sie liefert den Verkäufer nur zurück, wenn er angemeldet ist UND alle
 * DSA-Pflichtangaben hinterlegt hat. Jede Aktion, die Daten verändert, geht
 * durch diese Funktion — ein ausgeblendeter Button im Browser ist kein Schutz,
 * weil Formulare auch ohne Browser abgeschickt werden können.
 */
async function verkaeuferMitUploadRecht() {
  const id = await angemeldeteVerkaeuferId();
  if (!id) redirect("/anmelden");

  const verkaeufer = await db().verkaeufer(id);
  if (!verkaeufer) {
    await sitzungBeenden();
    redirect("/anmelden");
  }

  const pruefung = dsaAngabenVollstaendig(verkaeufer);
  if (!pruefung.ok) {
    return {
      verkaeufer: null,
      fehler:
        "Deine Verkäuferangaben sind unvollständig. Es fehlt: " +
        pruefung.fehlend.join(", ") +
        ". Ohne diese gesetzlich vorgeschriebenen Angaben kannst du keine Produkte einstellen.",
    };
  }

  return { verkaeufer, fehler: null };
}

export async function produktAnlegen(
  _bisher: ProduktZustand,
  formular: FormData,
): Promise<ProduktZustand> {
  const { verkaeufer, fehler } = await verkaeuferMitUploadRecht();
  if (!verkaeufer) return { fehler: fehler! };

  const geprueft = produktSchema.safeParse({
    titel: (formular.get("titel") ?? "").toString(),
    beschreibung: (formular.get("beschreibung") ?? "").toString(),
    kategorie: (formular.get("kategorie") ?? "").toString(),
  });

  if (!geprueft.success) {
    return { fehler: geprueft.error.issues[0].message };
  }

  // Der Preis wird als Text eingegeben ("19,90") und serverseitig in Cent
  // umgerechnet. Der Browser schickt nie einen Cent-Betrag mit.
  const preisCent = euroStringZuCent((formular.get("preis") ?? "").toString());
  if (preisCent === null) {
    return { fehler: "Bitte gib den Preis als Zahl an, zum Beispiel 19,90." };
  }
  if (preisCent < MIN_PREIS_CENT) {
    return { fehler: `Der Mindestpreis liegt bei ${formatEuro(MIN_PREIS_CENT)}.` };
  }
  if (preisCent > MAX_PREIS_CENT) {
    return { fehler: `Der Höchstpreis liegt bei ${formatEuro(MAX_PREIS_CENT)}.` };
  }

  const datei = formular.get("datei");
  if (!(datei instanceof File) || datei.size === 0) {
    return { fehler: "Bitte lade die Produktdatei hoch, die der Käufer bekommt." };
  }
  if (datei.size > MAX_DATEI_BYTES) {
    return { fehler: "Die Datei ist größer als 50 MB." };
  }

  const produkt = await db().produktAnlegen(verkaeufer.id, {
    ...geprueft.data,
    preis_cent: preisCent,
  });

  const gespeichert = await db().produktDateiSpeichern(verkaeufer.id, produkt.id, {
    name: datei.name,
    groesse: datei.size,
    inhalt: new Uint8Array(await datei.arrayBuffer()),
  });

  if ("fehler" in gespeichert) {
    return { fehler: gespeichert.fehler };
  }

  revalidatePath("/dashboard");
  return {
    erfolg: `„${produkt.titel}" wurde als Entwurf gespeichert. Reiche es zur Prüfung ein, damit es im Katalog erscheint.`,
  };
}

/** Entwurf zur Prüfung einreichen. Die Freigabe auf 'live' macht der Admin. */
export async function zurPruefungEinreichen(formular: FormData): Promise<void> {
  const { verkaeufer } = await verkaeuferMitUploadRecht();
  if (!verkaeufer) return;

  const produktId = (formular.get("produkt_id") ?? "").toString();

  // produktAktualisieren filtert selbst nach seller_id — ein fremdes Produkt
  // lässt sich damit auch mit erratener ID nicht verändern.
  const produkt = await db().produktAktualisieren(verkaeufer.id, produktId, {
    status: "review",
  });

  // Bewusst ohne await auf den Erfolg der Mail zu warten — siehe
  // registrieren/aktionen.ts für die gleiche Begründung.
  if (produkt) {
    void produktZurPruefungAnBetreiberSenden({
      verkaeuferName: verkaeufer.name,
      produktTitel: produkt.titel,
      kategorie: produkt.kategorie,
    });
  }

  revalidatePath("/dashboard");
}

export async function abmelden(): Promise<void> {
  await sitzungBeenden();
  redirect("/");
}
