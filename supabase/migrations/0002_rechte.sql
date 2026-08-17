-- ===========================================================================
-- Digitalmarkt — Tabellenrechte und Datei-Ablage
--
-- Nachtrag zu 0001. Ausführen wie 0001: SQL Editor -> New query -> einfügen
-- -> Run. Auch diese Datei ist wiederholbar.
--
-- Hintergrund: In Postgres gibt es ZWEI Ebenen der Zugriffskontrolle.
--
--   1. GRANT  — darf die Rolle die Tabelle überhaupt anfassen?
--   2. RLS    — welche ZEILEN darf sie dann sehen?
--
-- 0001 hat nur Ebene 2 gesetzt. Ohne Ebene 1 antwortet die Datenbank mit
-- "permission denied for table" — die Sicherheitsregeln kommen gar nicht
-- erst zum Zug. Beide Ebenen sind nötig.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Ebene 1: Tabellenrechte
--
-- Bewusst so eng wie möglich. Was hier nicht steht, ist unmöglich — auch dann,
-- wenn eine RLS-Policy es theoretisch erlauben würde.
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;

-- Katalog: nicht angemeldete Besucher dürfen Produkte lesen.
-- Welche, entscheidet die RLS-Policy (nur status = 'live').
grant select on public.products to anon, authenticated;

-- Verkäufer verwaltet seine Stammdaten und seine Produkte.
-- Kein delete: Produkte werden auf status = 'removed' gesetzt, nicht gelöscht,
-- damit Bestellungen und Belege nachvollziehbar bleiben.
grant select, insert, update on public.sellers  to authenticated;
grant select, insert, update on public.products to authenticated;

-- Bestellungen nur lesen. Angelegt werden sie ausschließlich serverseitig.
grant select on public.orders to authenticated;

-- Melden darf jeder, auch ohne Konto. Lesen darf niemand außer dem Betreiber.
grant insert on public.abuse_reports to anon, authenticated;

-- Öffentliche Verkäuferangaben (Name, Ort, Land) für die Produktseite.
-- Ohne dieses Recht kann der Katalog den Anbieter nicht anzeigen. Welche
-- Spalten sichtbar sind, begrenzt zusätzlich die Anwendung.
grant select (id, name, ort, land) on public.sellers to anon;

-- ---------------------------------------------------------------------------
-- Datei-Ablage
--
-- Der Bucket ist privat. Ein Verkäufer darf ausschließlich in seinen eigenen
-- Ordner schreiben — der Ordnername ist seine Nutzer-ID.
--
-- Käufer bekommen NIE eine Policy. Downloads laufen nach bezahlter Bestellung
-- über serverseitig signierte Links mit Ablaufzeit (Phase 2).
-- ---------------------------------------------------------------------------

drop policy if exists "verkaeufer laedt in eigenen ordner" on storage.objects;
create policy "verkaeufer laedt in eigenen ordner"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'produktdateien'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "verkaeufer sieht eigenen ordner" on storage.objects;
create policy "verkaeufer sieht eigenen ordner"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'produktdateien'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "verkaeufer ersetzt eigene datei" on storage.objects;
create policy "verkaeufer ersetzt eigene datei"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'produktdateien'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ---------------------------------------------------------------------------
-- Kontrolle
--
-- Nach dem Ausführen sollte diese Abfrage vier Zeilen mit rls = true zeigen.
-- ---------------------------------------------------------------------------

select
  tablename  as tabelle,
  rowsecurity as rls
from pg_tables
where schemaname = 'public'
  and tablename in ('sellers','products','orders','abuse_reports')
order by tablename;
