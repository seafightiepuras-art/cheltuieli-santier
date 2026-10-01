-- Adaugă suport pentru avize în EUR, pe lângă RON.
-- Rulează o singură dată, în SQL Editor-ul Supabase.

create type moneda_cheltuiala as enum ('RON', 'EUR');

alter table public.avize
  add column moneda moneda_cheltuiala not null default 'RON';
