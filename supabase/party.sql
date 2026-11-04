-- Tabulka pro živé pořadí. Spustit v Supabase → SQL Editor.
--
-- NEZAKLÁDEJ kvůli hře nový projekt. Free plán má strop dva běžící projekty,
-- ale tabulek může mít jeden projekt kolik chce. Pusť tenhle skript klidně
-- v projektu, který už používáš na něco jiného – tabulka má předponu,
-- takže se ti tam nic nepomíchá.
--
-- Drží se v ní stav týmů. Číst a zapisovat smí jen přihlášený účet hry,
-- viz „PŘÍSTUP JEN S HESLEM HRY" níž.

create table if not exists public.tourdepub_tymy (
  id        uuid primary key,
  hra       text not null,
  nazev     text not null,
  barva     text not null default '',
  hospoda   int  not null default 1,
  body      int  not null default 0,
  rozpad    jsonb not null default '{}'::jsonb,
  -- celý stav týmu, ne jen výsledek: bez něj by šel tým upravovat jenom
  -- na telefonu, kde vznikl
  stav      jsonb not null default '{}'::jsonb,
  upraveno  timestamptz not null default now()
);

-- pro tabulky založené dřív, než sloupec existoval
alter table public.tourdepub_tymy add column if not exists stav jsonb not null default '{}'::jsonb;

-- Barva party z appky zmizela (tým je jméno, ne barva), ale sloupec tu zůstal
-- povinný a shazoval každý zápis: appka se tvářila připojeně a na server
-- se přitom nikdy nic nedostalo. Zápis ji teď posílá prázdnou, tohle je pro
-- případ, že by jednou přestal.
alter table public.tourdepub_tymy alter column barva drop not null;
alter table public.tourdepub_tymy alter column barva set default '';

create index if not exists tourdepub_tymy_hra_idx on public.tourdepub_tymy (hra);

-- Strop na velikost, ať se do tabulky nedá nacpat cokoli. Skutečný tým má
-- stav kolem stovky bajtů, strop je čtvrt mega.
alter table public.tourdepub_tymy drop constraint if exists tourdepub_tymy_meze;
alter table public.tourdepub_tymy add constraint tourdepub_tymy_meze check (
  char_length(hra) <= 40
  and char_length(nazev) <= 60
  and char_length(coalesce(barva, '')) <= 20
  and pg_column_size(stav) <= 262144
  and pg_column_size(rozpad) <= 65536
);

alter table public.tourdepub_tymy enable row level security;

-- PŘÍSTUP JEN S HESLEM HRY.
--
-- Dřív byla tabulka otevřená roli anon, tedy komukoli s adresou projektu
-- a veřejným klíčem z prohlížeče: číst, přepisovat i mazat čárky všem.
-- Teď pouští jen přihlášené účty, které mají v app_metadata roli Tour de Pub:
--   tourdepub = 'hrac'     společný účet party (heslo hry), čte a zapisuje
--   tourdepub = 'spravce'  účet správce, navíc smí mazat týmy
-- Samotné „je přihlášený" by nestačilo: projekt sdílí osobní appka, a kdyby
-- v Auth zůstala zapnutá registrace, přihlásit by se mohl kdokoli.
-- app_metadata umí měnit jen server, ne prohlížeč.
--
-- Účty se zakládají v Supabase → Authentication → Users → Add user
-- (Auto Confirm User zaškrtnout), e-maily jsou v src/lib/nastaveni.ts.
-- Hesla sem nepatří. Roli pak dá:
--
--   update auth.users set raw_app_meta_data = raw_app_meta_data || '{"tourdepub":"hrac"}'
--    where email = 'tourdepub-hrac@betelnarezba.cz';
--   update auth.users set raw_app_meta_data = raw_app_meta_data || '{"tourdepub":"spravce"}'
--    where email = 'tourdepub-spravce@betelnarezba.cz';
--
-- Role se dostane do přihlášení až při dalším přihlášení nebo obnovení tokenu.
revoke all on public.tourdepub_tymy from anon;
-- TRUNCATE obchází RLS. Přes API se volat nedá, ale nemá tu co dělat.
revoke all on public.tourdepub_tymy from authenticated;
grant select, insert, update, delete on public.tourdepub_tymy to authenticated;

drop policy if exists "kdokoli cte" on public.tourdepub_tymy;
drop policy if exists "kdokoli zapisuje" on public.tourdepub_tymy;
drop policy if exists "kdokoli upravuje" on public.tourdepub_tymy;
drop policy if exists "kdokoli maze" on public.tourdepub_tymy;

drop policy if exists "hraci ctou" on public.tourdepub_tymy;
create policy "hraci ctou" on public.tourdepub_tymy for select to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'tourdepub') in ('hrac', 'spravce'));

drop policy if exists "hraci zakladaji" on public.tourdepub_tymy;
create policy "hraci zakladaji" on public.tourdepub_tymy for insert to authenticated
  with check ((select auth.jwt() -> 'app_metadata' ->> 'tourdepub') in ('hrac', 'spravce'));

drop policy if exists "hraci upravuji" on public.tourdepub_tymy;
create policy "hraci upravuji" on public.tourdepub_tymy for update to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'tourdepub') in ('hrac', 'spravce'))
  with check ((select auth.jwt() -> 'app_metadata' ->> 'tourdepub') in ('hrac', 'spravce'));

-- Smazaný tým zmizí ostatním z pořadí i s čárkami. To smí jen správce,
-- appka to hráčům ani nenabízí, ale rozhoduje tohle pravidlo.
drop policy if exists "spravce maze" on public.tourdepub_tymy;
create policy "spravce maze" on public.tourdepub_tymy for delete to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'tourdepub') = 'spravce');

-- Aby se změny rozesílaly ostatním telefonům živě.
-- Přidání se dělá podmíněně, aby druhé spuštění skriptu nespadlo na tom,
-- že už tam tabulka je.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'tourdepub_tymy'
  ) then
    alter publication supabase_realtime add table public.tourdepub_tymy;
  end if;
end $$;
