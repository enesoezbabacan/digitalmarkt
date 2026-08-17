-- ===========================================================================
-- Digitalmarkt — Provisionsrechnungen
--
-- Ausführen wie die anderen: SQL Editor -> New query -> einfügen -> Run.
--
-- WARUM EINE EIGENE TABELLE
--
-- Eine Rechnungsnummer muss dauerhaft festgeschrieben sein. Sie aus der
-- Bestellung abzuleiten oder bei jedem Aufruf neu zu erzeugen wäre falsch:
-- Ändert sich später die Berechnung, bekäme derselbe Vorgang eine andere
-- Nummer — und eine Rechnung, die ihre Nummer wechselt, ist keine Rechnung.
--
-- § 14 Abs. 4 Nr. 4 UStG verlangt eine "fortlaufende Nummer mit einer oder
-- mehreren Zahlenreihen, die zur Identifizierung der Rechnung vom Rechnungs-
-- aussteller einmalig vergeben wird".
--
-- ZUR AUFBEWAHRUNG (GoBD)
-- Die Rechnungsdaten liegen hier unveränderlich; das PDF wird daraus jederzeit
-- identisch neu erzeugt. Betrag und Nummer sind gegen Änderung gesperrt (siehe
-- Trigger unten) — nachträglich korrigiert wird über eine Storno-Rechnung,
-- nicht durch Überschreiben.
-- ===========================================================================

create table if not exists public.commission_invoices (
  id            uuid primary key default gen_random_uuid(),

  -- Genau eine Provisionsrechnung je Bestellung.
  order_id      uuid        not null unique
                            references public.orders (id) on delete restrict,

  -- Fortlaufende Nummer, z. B. "P-2026-0001".
  nummer        text        not null unique,

  -- Stichtag der Leistung = Tag des Verkaufs.
  leistungsdatum date       not null,

  -- Alles in ganzzahligen Cent, wie im gesamten Projekt.
  betrag_cent   integer     not null check (betrag_cent >= 0),

  -- Umsatzsteuersatz in Prozentpunkten. 0 = Kleinunternehmer nach § 19 UStG.
  ust_prozent   integer     not null default 0 check (ust_prozent between 0 and 25),
  ust_cent      integer     not null default 0 check (ust_cent >= 0),

  -- Empfängerangaben zum Zeitpunkt der Rechnungsstellung eingefroren. Zieht
  -- ein Verkäufer später um, muss die alte Rechnung unverändert bleiben.
  empfaenger    jsonb       not null,

  created_at    timestamptz not null default now()
);

create index if not exists commission_invoices_nummer_idx
  on public.commission_invoices (nummer);

-- ---------------------------------------------------------------------------
-- Unveränderlichkeit
--
-- Eine ausgestellte Rechnung wird nicht mehr angefasst. Ohne diese Sperre
-- würde ein Programmierfehler ausreichen, um Beträge rückwirkend zu ändern —
-- und damit die Buchführung wertlos zu machen.
-- ---------------------------------------------------------------------------

create or replace function public.rechnung_unveraenderlich()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Eine ausgestellte Provisionsrechnung darf nicht geändert oder gelöscht werden. Korrekturen erfolgen über eine Storno-Rechnung.';
end;
$$;

drop trigger if exists commission_invoices_unveraenderlich on public.commission_invoices;
create trigger commission_invoices_unveraenderlich
  before update or delete on public.commission_invoices
  for each row execute function public.rechnung_unveraenderlich();

-- ---------------------------------------------------------------------------
-- Rechte
--
-- Rechnungen sind ausschließlich Sache des Betreibers. Es gibt bewusst KEINE
-- Policy für anon oder authenticated — der Zugriff läuft allein über den
-- service_role-Schlüssel im Admin-Bereich.
-- ---------------------------------------------------------------------------

alter table public.commission_invoices enable row level security;

grant select, insert on public.commission_invoices to service_role;

-- ---------------------------------------------------------------------------
-- Kontrolle
-- ---------------------------------------------------------------------------

select
  has_table_privilege('service_role', 'public.commission_invoices', 'SELECT') as lesen,
  has_table_privilege('service_role', 'public.commission_invoices', 'INSERT') as anlegen,
  has_table_privilege('anon',         'public.commission_invoices', 'SELECT') as anon_lesen;
