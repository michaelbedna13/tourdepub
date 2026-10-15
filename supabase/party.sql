-- Tabulka pro živé pořadí. Spustit v Supabase → SQL Editor.
--
-- NEZAKLÁDEJ kvůli hře nový projekt. Free plán má strop dva běžící projekty,
-- ale tabulek může mít jeden projekt kolik chce. Pusť tenhle skript klidně
-- v projektu, který už používáš na něco jiného – tabulka má předponu,
-- takže se ti tam nic nepomíchá.
--
-- Drží se v ní jen to, co má vidět druhá parta: jméno, barva, štace a skóre.
-- Co kdo splnil, zůstává v telefonu.

create table if not exists public.tourdepub_tymy (
  id        uuid primary key,
  hra       text not null,
  nazev     text not null,
  barva     text not null,
  hospoda   int  not null default 1,
  body      int  not null default 0,
  rozpad    jsonb not null default '{}'::jsonb,
  upraveno  timestamptz not null default now()
);

create index if not exists tourdepub_tymy_hra_idx on public.tourdepub_tymy (hra);

alter table public.tourdepub_tymy enable row level security;

-- Hra běží jeden večer mezi známými, tak je to otevřené komukoli s odkazem.
-- Kdyby to mělo viset na internetu dýl, nahraď to přihlášením.
drop policy if exists "kdokoli cte" on public.tourdepub_tymy;
create policy "kdokoli cte" on public.tourdepub_tymy for select using (true);

drop policy if exists "kdokoli zapisuje" on public.tourdepub_tymy;
create policy "kdokoli zapisuje" on public.tourdepub_tymy for insert with check (true);

drop policy if exists "kdokoli upravuje" on public.tourdepub_tymy;
create policy "kdokoli upravuje" on public.tourdepub_tymy for update using (true);

-- Aby se změny rozesílaly ostatním telefonům živě.
alter publication supabase_realtime add table public.tourdepub_tymy;
