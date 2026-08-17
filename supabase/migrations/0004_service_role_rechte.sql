-- ===========================================================================
-- Digitalmarkt — Rechte für den Serverzugang (service_role)
--
-- Ausführen wie die anderen: SQL Editor -> New query -> einfügen -> Run.
--
-- WARUM DAS NÖTIG IST
--
-- Migration 0002 hat Tabellenrechte an anon und authenticated vergeben, aber
-- nicht an service_role. Bei diesem Supabase-Projekt greifen die sonst
-- üblichen Standardrechte nicht, deshalb lief jeder serverseitige Zugriff in
-- "permission denied for table".
--
-- Betroffen wären gewesen:
--   • der Stripe-Webhook (legt Bestellungen an, ohne angemeldeten Nutzer)
--   • die Download-Route (liest Bestellung und Datei über den Token)
--   • das Speichern der stripe_account_id nach dem Verkäufer-Onboarding
--   • der Admin-Bereich
--
-- Ein echter Kauf hätte also Geld eingezogen, ohne die Bestellung zu speichern.
--
-- ZUR EINORDNUNG
-- service_role umgeht Row Level Security ohnehin. Diese Grants öffnen also
-- nichts, was nicht ohnehin vorgesehen wäre — sie stellen nur her, was in
-- einem Supabase-Projekt normalerweise voreingestellt ist. Der Schlüssel
-- gehört weiterhin ausschließlich auf den Server, nie in den Browser.
-- ===========================================================================

grant usage on schema public to service_role;

grant select, insert, update, delete on public.sellers       to service_role;
grant select, insert, update, delete on public.products      to service_role;
grant select, insert, update, delete on public.orders        to service_role;
grant select, insert, update, delete on public.abuse_reports to service_role;

grant select on public.sellers_public to service_role;

-- Sequenzen, falls später welche dazukommen.
grant usage, select on all sequences in schema public to service_role;

-- Damit künftige Tabellen nicht wieder ohne Rechte dastehen.
alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;

alter default privileges in schema public
  grant usage, select on sequences to service_role;

-- ---------------------------------------------------------------------------
-- Kontrolle
--
-- Sollte für jede der vier Tabellen eine Zeile mit vier "true" zeigen.
-- ---------------------------------------------------------------------------

select
  table_name                                                as tabelle,
  has_table_privilege('service_role', 'public.' || table_name, 'SELECT') as lesen,
  has_table_privilege('service_role', 'public.' || table_name, 'INSERT') as anlegen,
  has_table_privilege('service_role', 'public.' || table_name, 'UPDATE') as aendern,
  has_table_privilege('service_role', 'public.' || table_name, 'DELETE') as loeschen
from information_schema.tables
where table_schema = 'public'
  and table_name in ('sellers', 'products', 'orders', 'abuse_reports')
order by table_name;
