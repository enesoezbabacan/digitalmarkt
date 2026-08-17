# Digitalmarkt

Marktplatz für digitale Produkte. Externe Verkäufer stellen E-Books, Vorlagen,
Presets und Kurse ein; Käufer bekommen sofort einen Download-Link. Der Betreiber
behält 20 % Provision pro Verkauf.

**Stand: Phase 1 und 2 sind fertig, Phase 3 läuft.** Fundament, Zahlung,
Auslieferung und der Betreiber-Bereich stehen. Offen sind Abuse-Formular,
Provisionsrechnungen, CSV-Export, Rechtstexte und Auffindbarkeit bei Google.

---

## Schnellstart

Node ist auf diesem Mac unter `~/.local/node/bin` installiert, aber nicht
automatisch im Terminal verfügbar. Einmalig einrichten:

```bash
echo 'export PATH="$HOME/.local/node/bin:$PATH"' >> ~/.zshrc
```

Danach ein **neues** Terminalfenster öffnen und prüfen:

```bash
node --version
```

Erwartete Ausgabe: `v22.14.0`

Dann das Projekt starten:

```bash
cd ~/digitalmarkt && npm run dev
```

Im Browser öffnen: <http://localhost:3000>

Beenden mit `Strg` + `C` im Terminal.

---

## Was jetzt schon funktioniert

- Öffentlicher Katalog mit Suche und Kategoriefilter
- Verkäufer-Registrierung mit allen Pflichtangaben nach Art. 30 DSA
- Ablehnung von Postfach- und Packstation-Adressen
- Automatische Prüfung der USt-IdNr. gegen die EU-Datenbank (VIES)
- Verkäufer-Bereich: Produkte anlegen, Datei hochladen, Preis setzen
- Trennung zwischen Verkäufern — niemand sieht fremde Daten
- Kauf über Stripe mit automatischem Provisionsabzug
- Download-Link per E-Mail, 72 Stunden gültig, höchstens 5 Abrufe
- Betreiber-Bereich unter `/admin`

**Noch nicht enthalten:** Abuse-Formular, Provisionsrechnungen, CSV-Export für
den Steuerberater, endgültige Rechtstexte.

---

## Betreiber-Bereich

Erreichbar unter <http://localhost:3000/admin>, später unter
`https://markt.select-prime.de/admin`. Dort lassen sich Produkte freigeben und
aus dem Katalog nehmen, Verkäufer sperren, Meldungen bearbeiten und Umsatz und
Provision einsehen.

Der Bereich ist **nicht verlinkt** und für alle anderen ein 404 — auch für
angemeldete Verkäufer. Wer hinein darf, steht in `ADMIN_EMAILS` in
`.env.local`, kommagetrennt. Die Adresse muss zu einem Konto gehören, mit dem
man sich anmelden kann.

Ist `ADMIN_EMAILS` leer, kommt **niemand** hinein. Das ist Absicht: ein
vergessener Eintrag darf den Bereich nicht für jeden Angemeldeten öffnen. Er
zeigt die Daten aller Verkäufer — Anschriften, Steuernummern, Umsätze.

Zwei Regeln sind fest eingebaut:

- Ein Produkt **ohne hinterlegte Datei** lässt sich nicht freigeben. Käufer
  bekämen sonst nichts geliefert.
- Wird ein Verkäufer gesperrt, verschwinden seine Produkte **sofort** aus dem
  Katalog. Entwürfe bleiben erhalten, damit bei einer Aufhebung der Sperre
  nichts verloren ist.

---

## Kosten

Der Aufbau kostet 0 €. Alle genutzten Dienste haben ausreichende Gratis-Tarife.
Stripe hat keine Grundgebühr — Gebühren entstehen nur je Verkauf und werden vom
Erlös abgezogen. Die einzige echte Ausgabe ist eine Domain (ca. 10–20 €/Jahr),
und die wird erst beim Livegang gebraucht.

---

## Konten: was wann gebraucht wird

| Dienst | Wofür | Ab wann | Kosten |
|---|---|---|---|
| Supabase | Datenbank + Dateiablage | Ende Phase 1 | Free-Tarif |
| Stripe | Zahlung + Auszahlung | Phase 2 | keine Grundgebühr |
| Resend | Bestätigungs-Mails | Phase 2 | 3.000 Mails/Monat gratis |
| Vercel | Hosting | beim Deployment | Hobby-Tarif |
| Domain | eigene Adresse, `shop@`, `abuse@` | beim Livegang | ca. 10–20 €/Jahr |

**Stripe früh anfangen.** Die Identitätsprüfung dauert ein bis drei Tage.
Gewerbeanmeldung und Ausweis bereithalten. Als Auszahlungskonto ist ein
**Geschäftskonto** nötig (z. B. Revolut Business) — der Kontoinhaber muss exakt
so heißen wie das Stripe-Konto.

---

## Konfiguration

Alle Zugangsdaten stehen in `.env.local`. Diese Datei wird nie in Git
eingecheckt und darf niemandem geschickt werden. `.env.example` ist die
dokumentierte Vorlage.

| Variable | Bedeutung |
|---|---|
| `DATENQUELLE` | `lokal` = JSON-Dateien ohne Konto, `supabase` = echte Datenbank |
| `SITZUNGS_GEHEIMNIS` | Signiert die Anmelde-Cookies. Neu erzeugen: `openssl rand -base64 48` |
| `UST_MODUS` | `regel` oder `kleinunternehmer` — **noch mit dem Steuerberater zu klären** |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ebenda. Darf öffentlich sein, RLS schützt ihn |
| `SUPABASE_SERVICE_ROLE_KEY` | ebenda. **Hebelt alle Sicherheitsregeln aus.** Nur serverseitig, nie mit `NEXT_PUBLIC_` |

Faustregel: alles mit `NEXT_PUBLIC_` ist im Browser für jeden lesbar. Alles
andere bleibt auf dem Server.

---

## Supabase einrichten (Ende Phase 1)

1. Auf <https://supabase.com> ein kostenloses Konto anlegen.
2. Neues Projekt erstellen, Region **Frankfurt (eu-central-1)** wählen — die
   Daten der Verkäufer sollen in der EU liegen.
3. Das Datenbank-Passwort sicher notieren, es wird nur einmal gezeigt.
4. Links im Menü **SQL Editor** öffnen, **New query**, den gesamten Inhalt von
   `supabase/migrations/0001_init.sql` einfügen und **Run** drücken.
5. Unter **Project Settings → API** die drei Werte kopieren und in `.env.local`
   eintragen.
6. In `.env.local` `DATENQUELLE=supabase` setzen und den Server neu starten.

Beide Migrationsdateien lassen sich gefahrlos mehrfach ausführen. `0002_rechte.sql`
ist dabei kein optionaler Nachtrag: Postgres hat zwei Ebenen der Zugriffskontrolle,
und ohne die Tabellenrechte aus 0002 antwortet die Datenbank nur mit
„permission denied for table".

### Anmeldung und Bestätigungsmail

Die Verkäufer-Anmeldung läuft über Supabase Auth. Neue Supabase-Projekte
verlangen eine **E-Mail-Bestätigung**: Nach der Registrierung ist das Konto
erst nutzbar, wenn der Link aus der Mail angeklickt wurde.

Damit dieser Link zurück auf die Anwendung zeigt, muss in Supabase unter
**Authentication → URL Configuration** die *Site URL* auf den Wert von
`NEXT_PUBLIC_SITE_URL` stehen (lokal `http://localhost:3000`). Beim Deployment
auf die echte Domain müssen beide Werte mitgeändert werden.

Die eingebaute Mail-Zustellung von Supabase ist stark begrenzt (wenige Mails
pro Stunde), verschickt über einen geteilten Absender und wird von manchen
Anbietern — iCloud zum Beispiel — kommentarlos weggefiltert. Sie ist nur zum
Ausprobieren gedacht.

> **OFFENER PUNKT VOR DEM LIVEGANG**
>
> Für die lokale Entwicklung wurde die Bestätigungspflicht in Supabase unter
> *Authentication → Sign In / Providers → Email* über den Schalter
> **Confirm email** abgeschaltet, weil die Bestätigungsmails bei iCloud nicht
> ankamen.
>
> Das muss rückgängig gemacht werden, sobald in Phase 2 Resend als Absender
> eingetragen ist. Ohne Bestätigung kann sich jeder mit einer fremden
> E-Mail-Adresse als Verkäufer registrieren — das kollidiert mit der
> Nachverfolgbarkeitspflicht nach Art. 30 DSA.

Weil zwischen Registrierung und erster Anmeldung die Bestätigung liegt, gibt es
in diesem Moment noch keine Sitzung — und ohne Sitzung lässt Row Level Security
kein Einfügen zu. Die Verkäuferangaben werden deshalb zunächst am Auth-Konto
hinterlegt und beim ersten angemeldeten Aufruf in die Tabelle `sellers`
übernommen (`zeileSicherstellen` in `src/lib/db/supabase.ts`).

---

## Tests

```bash
npm test
```

Geprüft werden die Stellen, an denen Fehler Geld oder Haftung kosten:

- Cent-Umrechnung und Provisionsberechnung (keine Fließkomma-Fehler,
  Provision plus Verkäuferanteil ergibt immer exakt den Kaufpreis)
- Postfach-Erkennung und die DSA-Pflichtangaben
- Trennung zwischen Verkäufern: A darf B weder sehen noch verändern
- Entwürfe erscheinen nicht im öffentlichen Katalog
- Dateinamen von Nutzern werden nie als Pfad übernommen

Ab Phase 2 kommen Tests für Kauf-Flow und Stripe-Webhook dazu — dort sind
Fehler am teuersten.

---

## Rechtliche Punkte, die vor dem ersten Verkauf geklärt sein müssen

1. **Widerrufsrecht.** Bei digitalen Inhalten erlischt es nicht automatisch
   durch den Download. Nötig ist die ausdrückliche Zustimmung des Käufers plus
   dessen Bestätigung, dass er dadurch sein Widerrufsrecht verliert
   (§ 356 Abs. 5 BGB). Das Feld `orders.widerruf_verzicht_at` steht dafür schon
   im Schema; die Checkbox kommt mit dem Kauf-Flow in Phase 2.
2. **Umsatzsteuer: Kleinunternehmer nach § 19 UStG** (festgelegt am 04.08.2026,
   `UST_MODUS=kleinunternehmer`). Auf Provisionsrechnungen wird keine USt
   ausgewiesen; stattdessen gehört der Hinweis „Gemäß § 19 UStG wird keine
   Umsatzsteuer berechnet." darauf. Grenzen seit 2025: 25.000 € Vorjahresumsatz
   und 100.000 € im laufenden Jahr, wobei die 100.000 € sofort wirken.
   Maßgeblich ist nur die Provision, nicht das Verkaufsvolumen der Verkäufer.

   Offen für Phase 2: Der Preishinweis „inkl. USt." auf Katalog- und
   Produktseite gilt für den **Verkäufer**, nicht für den Betreiber. Verkauft
   ein Verkäufer selbst als Kleinunternehmer, ist der Hinweis dort falsch.
   Dafür braucht `sellers` ein Kennzeichen, das bei der Registrierung abgefragt
   und beim Preis ausgewertet wird.
3. **Gutschrift oder Provisionsrechnung.** Bei Stripe Direct Charges verkauft
   der Verkäufer an den Käufer, und der Marktplatz verkauft dem Verkäufer eine
   Vermittlungsleistung. Die passende Richtung ist damit eine
   Provisionsrechnung an den Verkäufer, nicht eine Gutschrift nach
   § 14 Abs. 2 UStG. Vor Phase 3 mit dem Steuerberater klären.
4. **Rechtstexte.** Impressum, Datenschutz, AGB und Widerrufsbelehrung sind
   Platzhalter. Kein echter Verkauf, bevor sie vollständig sind.

---

## Aufbau des Projekts

| Pfad | Inhalt |
|---|---|
| `src/app/page.tsx` | Öffentlicher Katalog |
| `src/app/produkt/[id]/` | Produktdetailseite |
| `src/app/registrieren/` | Verkäufer-Registrierung |
| `src/app/anmelden/` | Anmeldung |
| `src/app/dashboard/` | Verkäufer-Bereich |
| `src/app/(rechtliches)/` | Impressum, Datenschutz, AGB, Widerruf, Meldeformular |
| `src/lib/geld.ts` | Cent-Rechnung, Provision, Euro-Formatierung |
| `src/lib/validation/verkaeufer.ts` | Pflichtangaben, Postfach-Regel, PLZ-Prüfung |
| `src/lib/vies.ts` | Prüfung der USt-IdNr. |
| `src/lib/sitzung.ts` | Signierte Anmelde-Cookies |
| `src/lib/db/` | Datenschicht: `lokal.ts` und später Supabase |
| `supabase/migrations/` | Schema und Sicherheitsregeln |
| `tests/` | Tests |

Die Datenschicht liegt hinter einem gemeinsamen Interface (`src/lib/db/typen.ts`).
Der Wechsel von lokalen Testdaten auf Supabase ist deshalb eine Zeile in
`.env.local` und kein Umbau.
