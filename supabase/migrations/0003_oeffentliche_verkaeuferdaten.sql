-- ===========================================================================
-- Digitalmarkt — Öffentliche Verkäuferdaten für den Katalog
--
-- Ausführen wie 0001 und 0002: SQL Editor -> New query -> einfügen -> Run.
--
-- Hintergrund: Die RLS-Policy auf sellers erlaubt SELECT nur für
-- "id = auth.uid()" — ein nicht angemeldeter Besucher hat keine auth.uid()
-- und sieht dadurch GAR KEINE Verkäuferzeile, auch nicht Name oder Ort für
-- ein öffentlich gelistetes Produkt. Der Katalog braucht das aber.
--
-- Die naheliegende "Lösung" — eine zweite Policy mit USING (true) für
-- SELECT — wäre ein Sicherheitsfehler: die Rolle "authenticated" hat auf
-- sellers vollen Spaltenzugriff (für die eigene Zeile gedacht), und
-- RLS-Policies filtern nur ZEILEN, nicht Spalten. Eine "true"-Policy würde
-- also jedem angemeldeten Verkäufer die kompletten Daten ALLER anderen
-- Verkäufer öffnen — Adressen, Steuernummern, alles.
--
-- Sauberer Weg: eine View, die von vornherein nur die unkritischen Spalten
-- enthält. Views laufen standardmäßig mit den Rechten des Eigentümers
-- (hier: des Migrationsausführenden, der RLS als Tabelleneigentümer umgeht),
-- nicht mit denen der abfragenden Rolle — die View selbst ist also die
-- Grenze, nicht RLS.
-- ===========================================================================

create or replace view public.sellers_public
with (security_invoker = false)
as
  select id, name, ort, land
  from public.sellers;

grant select on public.sellers_public to anon, authenticated;

-- Der ursprüngliche column-level Grant aus 0002 lief ins Leere (RLS ließ
-- ohnehin keine Zeile für anon durch) und wird durch die View ersetzt.
revoke select (id, name, ort, land) on public.sellers from anon;
