-- Migration 007: department licensing and organization-based access for collaborative ICS map

create table if not exists collab_counties (
  id uuid primary key default gen_random_uuid(),
  county_name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists collab_organizations (
  id uuid primary key default gen_random_uuid(),
  county_id uuid references collab_counties(id) on delete set null,
  organization_name text not null,
  license_status text not null default 'active',
  seat_limit int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_collab_org_license_status check (license_status in ('active', 'inactive'))
);

create unique index if not exists uq_collab_org_name_per_county
  on collab_organizations (coalesce(county_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(organization_name));

create table if not exists collab_org_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references collab_organizations(id) on delete cascade,
  trainer_id uuid references trainers(id) on delete set null,
  trainer_ref text not null,
  email text not null,
  display_name text not null,
  is_admin boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_collab_org_member_email check (position('@' in email) > 1),
  unique (trainer_ref),
  unique (organization_id, email)
);

alter table collab_map_sessions
  add column if not exists organization_id uuid references collab_organizations(id) on delete set null;

create index if not exists idx_collab_sessions_org on collab_map_sessions(organization_id, created_at desc);

create table if not exists collab_map_session_org_access (
  session_id uuid not null references collab_map_sessions(id) on delete cascade,
  organization_id uuid not null references collab_organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (session_id, organization_id)
);

create index if not exists idx_collab_session_org_access_org on collab_map_session_org_access(organization_id, created_at desc);

drop trigger if exists trg_collab_counties_updated_at on collab_counties;
create trigger trg_collab_counties_updated_at
before update on collab_counties
for each row execute function set_updated_at();

drop trigger if exists trg_collab_organizations_updated_at on collab_organizations;
create trigger trg_collab_organizations_updated_at
before update on collab_organizations
for each row execute function set_updated_at();

drop trigger if exists trg_collab_org_members_updated_at on collab_org_members;
create trigger trg_collab_org_members_updated_at
before update on collab_org_members
for each row execute function set_updated_at();
