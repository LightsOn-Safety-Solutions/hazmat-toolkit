-- Hazmat Toolkit backend (PostgreSQL + PostGIS)
-- Migration 003: Indexes, uniqueness rules, and updated_at triggers

create index if not exists idx_scenarios_trainer_ref on scenarios(trainer_ref);
create index if not exists idx_scenarios_status on scenarios(status);

create index if not exists idx_scenario_shapes_scenario_id on scenario_shapes(scenario_id);
create index if not exists idx_scenario_shapes_sort on scenario_shapes(scenario_id, sort_order asc);
create index if not exists idx_scenario_shapes_geom_gist on scenario_shapes using gist (geom);

create unique index if not exists uq_live_join_code
  on scenario_sessions(join_code)
  where status in ('scheduled', 'live');

create index if not exists idx_sessions_scenario_id on scenario_sessions(scenario_id);
create index if not exists idx_sessions_live on scenario_sessions(is_live, status);
create index if not exists idx_sessions_join_expiry on scenario_sessions(join_code_expires_at);

create index if not exists idx_participants_session on session_participants(session_id);
create index if not exists idx_participants_last_seen on session_participants(last_seen_at);

create index if not exists idx_tracking_session_recorded on tracking_points(session_id, recorded_at asc);
create index if not exists idx_tracking_participant_recorded on tracking_points(participant_id, recorded_at asc);
create index if not exists idx_tracking_position_gist on tracking_points using gist (position);
create index if not exists idx_tracking_batch_id on tracking_points(batch_id);

create index if not exists idx_join_attempts_code_time on join_attempt_logs(join_code, created_at desc);

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_scenarios_updated_at on scenarios;
create trigger trg_scenarios_updated_at
before update on scenarios
for each row execute function set_updated_at();

drop trigger if exists trg_shapes_updated_at on scenario_shapes;
create trigger trg_shapes_updated_at
before update on scenario_shapes
for each row execute function set_updated_at();

drop trigger if exists trg_sessions_updated_at on scenario_sessions;
create trigger trg_sessions_updated_at
before update on scenario_sessions
for each row execute function set_updated_at();
