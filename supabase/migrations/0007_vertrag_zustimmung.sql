-- ===========================================================================
-- Digitalmarkt — Zustimmung zu AGB und Verkäufervertrag
--
-- Ausführen wie die vorherigen: Supabase -> SQL Editor -> New query ->
-- einfügen -> Run. Wiederholbares Skript, mehrfaches Ausführen schadet nicht.
--
-- Warum das eine eigene Spalte braucht:
--
-- Es genügt nicht, den Vertrag auf die Seite zu stellen. Im Streitfall muss
-- der Betreiber beweisen, DASS und WANN der Verkäufer zugestimmt hat, und in
-- welcher FASSUNG. Ein Häkchen, das nirgends gespeichert wird, beweist nichts.
--
-- Deshalb zwei Angaben statt einer:
--   bedingungen_akzeptiert_at      wann
--   bedingungen_fassung            welcher Stand der Texte
--
-- Ohne die Fassung wäre der Nachweis wertlos, sobald die Texte einmal
-- geändert wurden — dann ließe sich nicht mehr sagen, wozu jemand ja gesagt
-- hat.
--
-- Die Spalten sind bewusst NULL-fähig: Bestandsverkäufer, die sich vor
-- dieser Änderung registriert haben, haben nicht zugestimmt. Ein
-- vorgetäuschter Wert wäre schlimmer als eine Lücke — er wäre eine falsche
-- Beweisurkunde. Diese Verkäufer müssen erneut zustimmen.
-- ===========================================================================

alter table public.sellers
  add column if not exists bedingungen_akzeptiert_at timestamptz,
  add column if not exists bedingungen_fassung       text;

comment on column public.sellers.bedingungen_akzeptiert_at is
  'Zeitpunkt der Zustimmung zu AGB und Verkäufervertrag. NULL = keine Zustimmung erteilt.';

comment on column public.sellers.bedingungen_fassung is
  'Stand der Texte, dem zugestimmt wurde, z. B. "2026-08". Ohne diese Angabe ist der Nachweis nach einer Textänderung wertlos.';

-- ---------------------------------------------------------------------------
-- Rechte für die neuen Spalten
--
-- In Postgres gelten Spaltenrechte nur dann automatisch, wenn das GRANT auf
-- der ganzen Tabelle liegt. 0002 und 0004 haben das so gesetzt, deshalb sind
-- hier keine zusätzlichen GRANTs nötig. Der folgende Aufruf ist trotzdem
-- vorhanden, damit ein Projekt mit spaltenweisen Rechten nicht stillschweigend
-- danebenliegt.
-- ---------------------------------------------------------------------------
grant select, insert, update on public.sellers to authenticated;
grant select, insert, update on public.sellers to service_role;
