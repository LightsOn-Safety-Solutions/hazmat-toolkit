alter table session_participants
  drop constraint if exists session_participants_session_id_trainee_name_key;

create index if not exists idx_session_participants_run_lookup
  on session_participants (
    session_id,
    lower(trainee_name),
    coalesce(last_seen_at, joined_at) desc
  );
