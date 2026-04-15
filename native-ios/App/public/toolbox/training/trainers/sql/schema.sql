-- Trainer Locator schema for Supabase (Postgres)
create extension if not exists pgcrypto;

create table if not exists public.trainers (
  id text primary key,
  name text not null,
  org text default '',
  email text default '',
  phone text default '',
  specialty text default '',
  topics text default '',
  notes text default '',
  lat double precision,
  lng double precision,
  location_label text default '',
  discipline text[] not null default '{}',
  hazmat_specialties text[] not null default '{}',
  travel_capability text default '',
  state text default '',
  region text default '',
  certifications text[] not null default '{}',
  experience_level text default '',
  background text[] not null default '{}',
  industry_experience text[] not null default '{}',
  training_type text[] not null default '{}',
  class_size text default '',
  custom_curriculum text default '',
  price_range text default '',
  availability text default '',
  record_status text not null default 'pending',
  submitted_at timestamptz default now(),
  reviewed_at timestamptz,
  reviewed_by text,
  rejection_reason text,
  submitter_type text not null default 'self-submitted',
  visibility text not null default 'admin-only',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trainers_status_idx on public.trainers (record_status);
create index if not exists trainers_visibility_idx on public.trainers (visibility);
create index if not exists trainers_state_idx on public.trainers (state);

create or replace function public.set_trainers_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_trainers_updated_at on public.trainers;
create trigger trg_trainers_updated_at
before update on public.trainers
for each row
execute function public.set_trainers_updated_at();

alter table public.trainers enable row level security;

-- Public can only read approved/public records.
drop policy if exists "public_read_approved_trainers" on public.trainers;
create policy "public_read_approved_trainers"
on public.trainers
for select
to anon, authenticated
using (record_status = 'approved' and visibility = 'public');

-- Authenticated users can submit pending records.
drop policy if exists "authenticated_insert_pending" on public.trainers;
create policy "authenticated_insert_pending"
on public.trainers
for insert
to anon, authenticated
with check (
  record_status = 'pending'
  and visibility = 'admin-only'
);

-- Admin updates should be handled by service role or stricter RLS by auth.jwt() claims.
-- Example (customize for your project):
-- create policy "super_admin_update" on public.trainers
-- for update to authenticated
-- using ((auth.jwt() ->> 'role') = 'super_admin')
-- with check ((auth.jwt() ->> 'role') = 'super_admin');
