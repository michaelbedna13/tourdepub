-- Tabulka pro živé pořadí. Spustit v Supabase → SQL Editor.
-- Drží se v ní jen to, co má vidět druhá parta: jméno, barva, štace a skóre.
-- Co kdo splnil, zůstává v telefonu.

create table if not exists public.party (
  id        uuid primary key,
  hra       text not null,
  nazev     text not null,
  barva     text not null,
  hospoda   int  not null default 1,
  body      int  not null default 0,
  rozpad    jsonb not null default '{}'::jsonb,
  upraveno  timestamptz not null default now()
);

create index if not exists party_hra_idx on public.party (hra);

alter table public.party enable row level security;

-- Hra běží jeden večer mezi známými, tak je to otevřené komukoli s odkazem.
-- Kdyby to mělo viset na internetu dýl, nahraď to přihlášením.
drop policy if exists "kdokoli cte" on public.party;
create policy "kdokoli cte" on public.party for select using (true);

drop policy if exists "kdokoli zapisuje" on public.party;
create policy "kdokoli zapisuje" on public.party for insert with check (true);

drop policy if exists "kdokoli upravuje" on public.party;
create policy "kdokoli upravuje" on public.party for update using (true);

-- Aby se změny rozesílaly ostatním telefonům živě.
alter publication supabase_realtime add table public.party;
