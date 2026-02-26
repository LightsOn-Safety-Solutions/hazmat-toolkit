-- Hazmat Toolkit backend (PostgreSQL + PostGIS)
-- Migration 002: Core tables for authoring, sessions, snapshots, and tracking

create table if not exists trainers (
  id uuid primary key default gen_random_uuid(),
  trainer_ref text unique,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists scenarios (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid references trainers(id) on delete set null,
  trainer_ref text,
  scenario_name text not null,
  detection_device device_type not null,
  scenario_date timestamptz,
  notes text not null default '',
  center_geog geography(Point, 4326),
  status scenario_status not null default 'draft',
  version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists scenario_shapes (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  description text not null,
  kind shape_kind not null,
  sort_order int not null,
  display_color_hex text,

  -- polygon/point use geom; circle uses center point in geom + radius_m
  geom geometry(Geometry, 4326) not null,
  radius_m double precision,

  -- Air monitor readings
  oxygen numeric(6,3),
  lel numeric(8,3),
  carbon_monoxide numeric(10,3),
  hydrogen_sulfide numeric(10,3),
  pid numeric(10,3),

  -- Radiation readings (string fields preserved to match current app flexibility)
  dose_rate text,
  background text,
  shielding text,
  rad_latitude double precision,
  rad_longitude double precision,
  rad_dose_unit text,
  rad_exposure_unit text,

  -- pH readings
  ph numeric(4,2),

  properties_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint chk_sort_order_nonnegative check (sort_order >= 0),
  constraint chk_circle_radius check ((kind <> 'circle') or (radius_m is not null and radius_m > 0)),
  constraint chk_noncircle_radius_null check ((kind = 'circle') or radius_m is null)
);

create table if not exists scenario_sessions (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete restrict,
  trainer_id uuid references trainers(id) on delete set null,
  trainer_ref text,
  session_name text,
  status session_status not null default 'scheduled',
  join_code text not null,
  join_code_expires_at timestamptz not null,
  join_code_last_rotated_at timestamptz not null default now(),
  starts_at timestamptz,
  ended_at timestamptz,
  is_live boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_join_code_len check (char_length(join_code) between 6 and 12)
);

create table if not exists session_snapshots (
  session_id uuid primary key references scenario_sessions(id) on delete cascade,
  scenario_id uuid not null references scenarios(id) on delete restrict,
  scenario_version int not null,
  snapshot_json jsonb not null,
  snapshot_sha256 text not null,
  created_at timestamptz not null default now()
);

create table if not exists session_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references scenario_sessions(id) on delete cascade,
  trainee_name text not null,
  device_type device_type not null,
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz,
  session_token_hash text not null unique,
  token_expires_at timestamptz not null,
  app_version text,
  device_label text,
  unique (session_id, trainee_name)
);

create table if not exists tracking_points (
  id bigint generated always as identity primary key,
  session_id uuid not null references scenario_sessions(id) on delete cascade,
  participant_id uuid not null references session_participants(id) on delete cascade,
  client_point_id uuid not null,
  recorded_at timestamptz not null,
  received_at timestamptz not null default now(),
  position geography(Point, 4326) not null,
  accuracy_m double precision,
  speed_mps double precision,
  heading_deg double precision,
  active_shape_id uuid,
  active_shape_sort_order int,
  is_backfilled boolean not null default false,
  batch_id uuid,
  sequence_in_batch int,
  meta_json jsonb not null default '{}'::jsonb,
  unique (participant_id, client_point_id)
);

create table if not exists join_attempt_logs (
  id bigint generated always as identity primary key,
  join_code text not null,
  trainee_name text,
  success boolean not null,
  reason text,
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now()
);
