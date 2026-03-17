-- Migration 005: Collaborative ICS map sessions, participants, objects, and mutations

create table if not exists collab_map_sessions (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid references trainers(id) on delete set null,
  trainer_ref text not null,
  incident_name text not null,
  commander_name text not null,
  commander_ics_role text not null,
  join_code text not null,
  join_code_expires_at timestamptz not null,
  session_status text not null default 'active',
  operational_period_start timestamptz not null,
  operational_period_end timestamptz not null,
  last_mutation_version bigint not null default 0,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_collab_session_status check (session_status in ('active', 'ended', 'expired')),
  constraint chk_collab_period_range check (operational_period_end > operational_period_start),
  constraint chk_collab_join_code_len check (char_length(join_code) between 6 and 12)
);

create table if not exists collab_map_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references collab_map_sessions(id) on delete cascade,
  trainer_ref text,
  display_name text not null,
  permission_tier text not null,
  ics_role text not null,
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  session_token_hash text unique,
  token_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_collab_permission_tier check (permission_tier in ('commander', 'operator', 'observer')),
  constraint chk_collab_token_pair check (
    (session_token_hash is null and token_expires_at is null)
    or
    (session_token_hash is not null and token_expires_at is not null)
  ),
  unique (session_id, trainer_ref),
  unique (session_id, display_name)
);

create table if not exists collab_map_objects (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references collab_map_sessions(id) on delete cascade,
  object_type text not null,
  geometry_type text not null,
  geometry_json jsonb not null,
  fields_json jsonb not null default '{}'::jsonb,
  created_by_participant_id uuid not null references collab_map_participants(id) on delete restrict,
  updated_by_participant_id uuid not null references collab_map_participants(id) on delete restrict,
  version bigint not null default 0,
  is_deleted boolean not null default false,
  active_lock_participant_id uuid references collab_map_participants(id) on delete set null,
  lock_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_collab_geometry_type check (geometry_type in ('point', 'line', 'polygon'))
);

create table if not exists collab_map_mutations (
  id bigint generated always as identity primary key,
  session_id uuid not null references collab_map_sessions(id) on delete cascade,
  object_id uuid not null references collab_map_objects(id) on delete cascade,
  version bigint not null,
  participant_id uuid not null references collab_map_participants(id) on delete restrict,
  mutation_type text not null,
  base_version bigint not null,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint chk_collab_mutation_type check (mutation_type in ('create', 'update', 'delete'))
);

create unique index if not exists uq_collab_join_code_active
  on collab_map_sessions(join_code)
  where session_status = 'active';

create index if not exists idx_collab_sessions_trainer_ref on collab_map_sessions(trainer_ref, created_at desc);
create index if not exists idx_collab_sessions_status on collab_map_sessions(session_status, operational_period_end asc);

create index if not exists idx_collab_participants_session on collab_map_participants(session_id, joined_at asc);
create index if not exists idx_collab_participants_token on collab_map_participants(session_token_hash);

create index if not exists idx_collab_objects_session on collab_map_objects(session_id, updated_at desc);
create index if not exists idx_collab_objects_not_deleted on collab_map_objects(session_id, is_deleted, version desc);

create unique index if not exists uq_collab_mutations_session_version
  on collab_map_mutations(session_id, version);

create index if not exists idx_collab_mutations_session_created
  on collab_map_mutations(session_id, created_at asc);

drop trigger if exists trg_collab_sessions_updated_at on collab_map_sessions;
create trigger trg_collab_sessions_updated_at
before update on collab_map_sessions
for each row execute function set_updated_at();

drop trigger if exists trg_collab_participants_updated_at on collab_map_participants;
create trigger trg_collab_participants_updated_at
before update on collab_map_participants
for each row execute function set_updated_at();

drop trigger if exists trg_collab_objects_updated_at on collab_map_objects;
create trigger trg_collab_objects_updated_at
before update on collab_map_objects
for each row execute function set_updated_at();
