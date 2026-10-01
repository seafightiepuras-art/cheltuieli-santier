-- ============================================================================
-- Cheltuieli Șantier — schema principală
-- Rulează acest fișier o dată în SQL Editor-ul proiectului Supabase.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- santiere — lista de șantiere pe care se centralizează cheltuielile
-- ---------------------------------------------------------------------------
create table if not exists public.santiere (
  id       uuid primary key default gen_random_uuid(),
  nume     text not null,
  activ    boolean not null default true,
  creat_la timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- avize — un aviz de însoțire a mărfii, legat de un șantier
-- (facturile se urmăresc separat, în alt loc — aici e doar evidența mărfii
-- primite pe șantier, ca să se vadă pe ce s-a dus banul)
-- ---------------------------------------------------------------------------
create type moneda_cheltuiala as enum ('RON', 'EUR');

create table if not exists public.avize (
  id            uuid primary key default gen_random_uuid(),
  santier_id    uuid not null references public.santiere(id) on delete restrict,
  numar_aviz    text,
  furnizor      text not null,
  data_aviz     date,
  moneda        moneda_cheltuiala not null default 'RON',
  poza_url      text,
  poza_path     text,
  camp_incert   text[] not null default '{}',
  creat_la      timestamptz not null default now()
);

create index if not exists idx_avize_santier on public.avize (santier_id);
create index if not exists idx_avize_numar on public.avize (numar_aviz);
create index if not exists idx_avize_furnizor on public.avize (furnizor);

-- ---------------------------------------------------------------------------
-- produse — fiecare material/produs de pe un aviz, ca rând separat (nu un
-- singur total pe aviz) — ca să se poată vedea "pe ce s-a dus banul" (ciment
-- vs. pavele vs. combustibil etc.), nu doar cât.
-- ---------------------------------------------------------------------------
create type categorie_cheltuiala as enum ('materiale', 'combustibil', 'utilaje', 'transport', 'diverse');

create table if not exists public.produse (
  id             uuid primary key default gen_random_uuid(),
  aviz_id        uuid not null references public.avize(id) on delete cascade,
  denumire       text not null,
  cantitate      numeric(12, 2),
  unitate_masura text,
  pret_unitar    numeric(12, 2),
  valoare        numeric(12, 2) not null default 0,
  categorie      categorie_cheltuiala not null default 'diverse',
  creat_la       timestamptz not null default now()
);

create index if not exists idx_produse_aviz on public.produse (aviz_id);

-- ============================================================================
-- RLS — fără autentificare în aplicație, dar mai strict decât facturi-app:
-- rolul anon (folosit de browser) are voie DOAR să citească. Orice scriere
-- (adăugare, ștergere) trece exclusiv prin API routes, cu cheia de service.
-- ============================================================================

alter table public.santiere enable row level security;
alter table public.avize enable row level security;
alter table public.produse enable row level security;

drop policy if exists "anon poate citi santiere" on public.santiere;
create policy "anon poate citi santiere" on public.santiere for select to anon using (true);

drop policy if exists "anon poate citi avize" on public.avize;
create policy "anon poate citi avize" on public.avize for select to anon using (true);

drop policy if exists "anon poate citi produse" on public.produse;
create policy "anon poate citi produse" on public.produse for select to anon using (true);

-- ============================================================================
-- Storage: bucket pentru pozele avizelor scanate
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('cheltuieli-poze', 'cheltuieli-poze', true)
on conflict (id) do nothing;

drop policy if exists "anon poate citi poze cheltuieli" on storage.objects;
create policy "anon poate citi poze cheltuieli"
  on storage.objects for select
  to anon using (bucket_id = 'cheltuieli-poze');

-- Notă: NU dăm voie lui "anon" să încarce/șteargă poze direct — upload-ul
-- trece prin /api/avize, cu cheia de service (vezi src/lib/supabase/admin.ts).
