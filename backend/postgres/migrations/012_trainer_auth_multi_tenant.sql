-- Migration 012: trainer authentication + multi-tenant organizations for Hazmat ToolK.I.T.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'trainer_role') then
    create type trainer_role as enum ('super_admin', 'org_admin', 'trainer', 'observer', 'student');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'scenario_visibility') then
    create type scenario_visibility as enum ('private', 'org_shared', 'assigned');
  end if;
end
$$;

alter table trainers
  add column if not exists email text,
  add column if not exists password_hash text,
  add column if not exists is_active boolean not null default true,
  add column if not exists last_login_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

update trainers
set email = lower(trainer_ref)
where email is null
  and trainer_ref is not null
  and position('@' in trainer_ref) > 1;

create unique index if not exists uq_trainers_email_lower
  on trainers (lower(email))
  where email is not null;

drop trigger if exists trg_trainers_updated_at on trainers;
create trigger trg_trainers_updated_at
before update on trainers
for each row execute function set_updated_at();

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  organization_name text not null,
  billing_email text,
  license_status text not null default 'trial',
  seat_limit int,
  app_distribution text not null default 'public_app_store',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_organizations_license_status check (license_status in ('trial', 'active', 'inactive')),
  constraint chk_organizations_distribution check (app_distribution in ('public_app_store', 'custom_app', 'internal'))
);

create table if not exists organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  trainer_id uuid not null references trainers(id) on delete cascade,
  role trainer_role not null default 'trainer',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, trainer_id)
);

create index if not exists idx_org_memberships_trainer on organization_memberships(trainer_id, is_active, created_at desc);
create index if not exists idx_org_memberships_org on organization_memberships(organization_id, is_active, created_at desc);

create table if not exists trainer_entitlements (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid references trainers(id) on delete cascade,
  organization_id uuid references organizations(id) on delete cascade,
  entitlement_key text not null,
  source text not null default 'manual',
  status text not null default 'active',
  expires_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_trainer_entitlements_status check (status in ('active', 'inactive', 'expired'))
);

create index if not exists idx_trainer_entitlements_trainer on trainer_entitlements(trainer_id, status, expires_at);
create index if not exists idx_trainer_entitlements_org on trainer_entitlements(organization_id, status, expires_at);
create unique index if not exists uq_trainer_entitlements_scope_key
  on trainer_entitlements (
    trainer_id,
    coalesce(organization_id, '00000000-0000-0000-0000-000000000000'::uuid),
    entitlement_key,
    source
  );

create table if not exists audit_logs (
  id bigint generated always as identity primary key,
  organization_id uuid references organizations(id) on delete cascade,
  actor_trainer_id uuid references trainers(id) on delete set null,
  actor_ref text,
  action text not null,
  entity_type text not null,
  entity_id text,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_org_created_at on audit_logs(organization_id, created_at desc);

alter table scenarios
  add column if not exists organization_id uuid references organizations(id) on delete set null,
  add column if not exists created_by_trainer_id uuid references trainers(id) on delete set null,
  add column if not exists visibility scenario_visibility not null default 'private',
  add column if not exists assigned_trainer_id uuid references trainers(id) on delete set null;

update scenarios
set created_by_trainer_id = trainer_id
where created_by_trainer_id is null
  and trainer_id is not null;

create index if not exists idx_scenarios_org_visibility_created
  on scenarios(organization_id, visibility, created_at desc);

create index if not exists idx_scenarios_created_by
  on scenarios(created_by_trainer_id, created_at desc);

create index if not exists idx_scenarios_assigned_trainer
  on scenarios(assigned_trainer_id, created_at desc);

drop trigger if exists trg_organizations_updated_at on organizations;
create trigger trg_organizations_updated_at
before update on organizations
for each row execute function set_updated_at();

drop trigger if exists trg_org_memberships_updated_at on organization_memberships;
create trigger trg_org_memberships_updated_at
before update on organization_memberships
for each row execute function set_updated_at();

drop trigger if exists trg_trainer_entitlements_updated_at on trainer_entitlements;
create trigger trg_trainer_entitlements_updated_at
before update on trainer_entitlements
for each row execute function set_updated_at();
