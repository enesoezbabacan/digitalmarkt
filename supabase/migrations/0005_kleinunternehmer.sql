-- ===========================================================================
-- Digitalmarkt — Kleinunternehmer-Kennzeichen je Verkäufer
--
-- Ausführen wie die anderen: SQL Editor -> New query -> einfügen -> Run.
--
-- WARUM
--
-- Der Katalog zeigt unter jedem Preis "inkl. USt.". Das stimmt nur für
-- Verkäufer, die tatsächlich Umsatzsteuer ausweisen. Ein Kleinunternehmer
-- nach § 19 UStG weist keine aus — die Angabe wäre dort falsch, und
-- Preisangaben müssen nach der Preisangabenverordnung zutreffend sein.
--
-- Die Angabe hängt am VERKÄUFER, nicht am Marktplatzbetreiber: Auf einem
-- Marktplatz verkaufen Kleinunternehmer und regelbesteuerte Anbieter
-- nebeneinander. Deshalb ein Feld in sellers und keine Einstellung in .env.
-- ===========================================================================

alter table public.sellers
  add column if not exists kleinunternehmer boolean not null default true;

comment on column public.sellers.kleinunternehmer is
  'true = § 19 UStG, keine Umsatzsteuer im Preis enthalten. '
  'Steuert die Preisauszeichnung im Katalog.';

-- Die öffentliche Ansicht muss das Kennzeichen mitliefern, damit der Katalog
-- den richtigen Hinweis anzeigen kann. Steuernummer und Anschrift bleiben
-- weiterhin außen vor.
create or replace view public.sellers_public
with (security_invoker = false)
as
  select id, name, ort, land, kleinunternehmer
  from public.sellers;

grant select on public.sellers_public to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Kontrolle
-- ---------------------------------------------------------------------------

select id, name, kleinunternehmer
from public.sellers_public
order by name;
