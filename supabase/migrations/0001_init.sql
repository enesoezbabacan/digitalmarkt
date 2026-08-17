-- ===========================================================================
-- Digitalmarkt — Grundschema
--
-- Ausführen im Supabase-Projekt unter: SQL Editor -> New query -> einfügen ->
-- "Run". Das Skript ist wiederholbar: es lässt sich mehrfach ausführen, ohne
-- Fehler zu werfen oder Daten zu löschen.
--
-- Alle Geldbeträge sind ganzzahlige Cent. Niemals Fließkomma für Geld —
-- 0.1 + 0.2 ergibt in Fließkomma nicht 0.3, und bei Provisionen kostet das
-- echtes Geld.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Tabellen
-- ---------------------------------------------------------------------------

-- Verkäufer. Die id entspricht der Nutzer-id aus Supabase Auth, damit die
-- Sicherheitsregeln unten direkt mit auth.uid() vergleichen können.
create table if not exists public.sellers (
  id                    uuid primary key references auth.users (id) on delete cascade,
  name                  text        not null check (length(btrim(name)) >= 2),
  email                 text        not null,
  telefon               text        not null check (length(btrim(telefon)) >= 6),

  -- Ladungsfähige Anschrift, Pflicht nach Art. 30 DSA.
  -- Ein Postfach genügt nicht; die Prüfung darauf sitzt in der Anwendung
  -- (src/lib/validation/verkaeufer.ts), weil sie sprachliche Muster erkennt.
  strasse               text        not null check (length(btrim(strasse)) >= 3),
  plz                   text        not null,
  ort                   text        not null,
  land                  text        not null check (land ~ '^[A-Z]{2}$'),

  steuernummer          text        not null check (length(btrim(steuernummer)) >= 5),
  ust_id                text,
  -- Ergebnis der VIES-Abfrage, Nachweis der Prüfpflicht nach Art. 30 Abs. 2 DSA.
  ust_id_pruefergebnis  text        check (ust_id_pruefergebnis in ('gueltig','ungueltig','unbekannt')),
  ust_id_geprueft_at    timestamptz,

  stripe_account_id     text        unique,
  status                text        not null default 'pending'
                                    check (status in ('pending','active','suspended')),
  rechte_bestaetigt_at  timestamptz,
  created_at            timestamptz not null default now()
);

create table if not exists public.products (
  id            uuid primary key default gen_random_uuid(),
  seller_id     uuid        not null references public.sellers (id) on delete cascade,
  titel         text        not null check (length(btrim(titel)) >= 3),
  beschreibung  text        not null check (length(btrim(beschreibung)) >= 20),
  kategorie     text        not null,
  preis_cent    integer     not null check (preis_cent between 100 and 500000),
  waehrung      text        not null default 'EUR' check (waehrung = 'EUR'),
  datei_pfad    text,
  datei_name    text,
  datei_groesse bigint,
  vorschau_bild text,
  status        text        not null default 'draft'
                            check (status in ('draft','review','live','removed')),
  created_at    timestamptz not null default now(),

  -- Ein Produkt darf nur dann öffentlich sein, wenn es eine Datei gibt.
  constraint live_braucht_datei check (status <> 'live' or datei_pfad is not null)
);

create table if not exists public.orders (
  id                     uuid primary key default gen_random_uuid(),
  product_id             uuid        not null references public.products (id) on delete restrict,
  seller_id              uuid        not null references public.sellers (id) on delete restrict,
  kaeufer_email          text        not null,

  betrag_cent            integer     not null check (betrag_cent > 0),
  provision_cent         integer     not null check (provision_cent >= 0),

  -- Verhindert, dass eine fehlerhafte Berechnung mehr Provision einbehält
  -- als der Kaufpreis hergibt.
  constraint provision_kleiner_betrag check (provision_cent <= betrag_cent),

  -- Idempotenz: Stripe stellt Webhooks mehrfach zu. Ein zweiter Aufruf mit
  -- derselben Zahlung darf keine zweite Bestellung erzeugen.
  stripe_payment_intent  text        unique,

  -- Zwei unabhängige Nachweise zum Standort des Käufers (Rechnungsland und
  -- IP-Land) — Nachweispflicht bei digitalen Leistungen in der EU.
  kaeufer_land           text,
  kaeufer_land_nachweis  jsonb,

  download_token         text        unique,
  token_ablauf           timestamptz,
  download_zaehler       integer     not null default 0 check (download_zaehler >= 0),

  -- Zeitpunkt der ausdrücklichen Zustimmung zum sofortigen Download.
  -- Ohne diesen Eintrag ERLISCHT DAS WIDERRUFSRECHT NICHT (§ 356 Abs. 5 BGB)
  -- und der Käufer kann 14 Tage lang sein Geld zurückverlangen.
  widerruf_verzicht_at   timestamptz,

  status                 text        not null default 'bezahlt'
                                     check (status in ('bezahlt','erstattet','storniert')),
  created_at             timestamptz not null default now()
);

create table if not exists public.abuse_reports (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid        not null references public.products (id) on delete cascade,
  melder_email text        not null,
  melder_name  text,
  grund        text        not null check (length(btrim(grund)) >= 20),
  status       text        not null default 'offen'
                           check (status in ('offen','geprueft','erledigt','abgelehnt')),
  notizen      text,
  created_at   timestamptz not null default now(),
  erledigt_at  timestamptz
);

create index if not exists products_seller_idx  on public.products (seller_id);
create index if not exists products_live_idx    on public.products (status) where status = 'live';
create index if not exists orders_seller_idx    on public.orders (seller_id, created_at desc);
create index if not exists abuse_offen_idx      on public.abuse_reports (status) where status = 'offen';

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- Ohne diese Regeln kann jeder Verkäufer mit dem öffentlichen anon-Key die
-- Daten aller anderen lesen — Anschriften, Steuernummern, Umsätze.
--
-- Grundsatz: erst alles verbieten, dann einzeln erlauben. Es gibt bewusst
-- KEINE Policy, die Verkäufern das Schreiben von Bestellungen erlaubt —
-- Bestellungen entstehen ausschließlich serverseitig über den service_role-Key.
-- ---------------------------------------------------------------------------

alter table public.sellers       enable row level security;
alter table public.products      enable row level security;
alter table public.orders        enable row level security;
alter table public.abuse_reports enable row level security;

-- ---- sellers --------------------------------------------------------------

drop policy if exists "verkaeufer liest eigene zeile" on public.sellers;
create policy "verkaeufer liest eigene zeile"
  on public.sellers for select
  using (id = (select auth.uid()));

drop policy if exists "verkaeufer legt eigene zeile an" on public.sellers;
create policy "verkaeufer legt eigene zeile an"
  on public.sellers for insert
  with check (id = (select auth.uid()));

-- Der Verkäufer darf seine Stammdaten pflegen, aber NICHT status oder
-- stripe_account_id — sonst schaltet er sich selbst frei oder leitet
-- fremde Auszahlungen um. Das erzwingt der Trigger unten.
drop policy if exists "verkaeufer pflegt eigene zeile" on public.sellers;
create policy "verkaeufer pflegt eigene zeile"
  on public.sellers for update
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create or replace function public.sellers_geschuetzte_felder()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- service_role umgeht RLS und darf alles; für alle anderen bleiben diese
  -- Felder unveränderlich.
  if current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'service_role' then
    return new;
  end if;

  new.status            := old.status;
  new.stripe_account_id := old.stripe_account_id;
  new.created_at        := old.created_at;
  return new;
end;
$$;

drop trigger if exists sellers_geschuetzte_felder on public.sellers;
create trigger sellers_geschuetzte_felder
  before update on public.sellers
  for each row execute function public.sellers_geschuetzte_felder();

-- ---- products -------------------------------------------------------------

-- Öffentlich sichtbar ist ausschließlich, was freigegeben wurde.
drop policy if exists "katalog zeigt freigegebene produkte" on public.products;
create policy "katalog zeigt freigegebene produkte"
  on public.products for select
  using (status = 'live');

drop policy if exists "verkaeufer sieht eigene produkte" on public.products;
create policy "verkaeufer sieht eigene produkte"
  on public.products for select
  using (seller_id = (select auth.uid()));

-- Anlegen nur für sich selbst, nur als Entwurf, und nur mit vollständigen
-- DSA-Angaben. Die Freigabe auf 'live' macht ausschließlich der Betreiber.
drop policy if exists "verkaeufer legt eigene produkte an" on public.products;
create policy "verkaeufer legt eigene produkte an"
  on public.products for insert
  with check (
    seller_id = (select auth.uid())
    and status = 'draft'
    and exists (
      select 1 from public.sellers s
      where s.id = (select auth.uid())
        and s.status <> 'suspended'
        and length(btrim(s.steuernummer)) >= 5
        and length(btrim(s.telefon))      >= 6
        and length(btrim(s.strasse))      >= 3
        and s.rechte_bestaetigt_at is not null
    )
  );

drop policy if exists "verkaeufer pflegt eigene produkte" on public.products;
create policy "verkaeufer pflegt eigene produkte"
  on public.products for update
  using (seller_id = (select auth.uid()))
  with check (
    seller_id = (select auth.uid())
    -- Selbstfreigabe ausgeschlossen: der Verkäufer kommt nur bis 'review'.
    and status in ('draft','review')
  );

-- ---- orders ---------------------------------------------------------------

-- Nur lesen, nie schreiben. Bestellungen legt allein der Server an.
drop policy if exists "verkaeufer sieht eigene bestellungen" on public.orders;
create policy "verkaeufer sieht eigene bestellungen"
  on public.orders for select
  using (seller_id = (select auth.uid()));

-- ---- abuse_reports --------------------------------------------------------

-- Melden darf jeder, auch ohne Konto. Lesen darf nur der Betreiber
-- (über den service_role-Key im Admin-Bereich).
drop policy if exists "jeder darf melden" on public.abuse_reports;
create policy "jeder darf melden"
  on public.abuse_reports for insert
  with check (true);

-- ---------------------------------------------------------------------------
-- Dateiablage
--
-- Privater Bucket: ohne gültigen, zeitlich begrenzten Link ist keine Datei
-- abrufbar. Es wird bewusst KEINE Storage-Policy für anon oder authenticated
-- angelegt — Downloads laufen ausschließlich über serverseitig signierte URLs
-- nach bezahlter Bestellung.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('produktdateien', 'produktdateien', false)
on conflict (id) do update set public = false;
