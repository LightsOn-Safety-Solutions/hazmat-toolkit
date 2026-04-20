-- Migration 017: Fix ensure_trainers_id trigger function
-- Remove btrim call on UUID column that was causing "function btrim(uuid) does not exist" error

drop trigger if exists trg_ensure_trainers_id on trainers;
drop function if exists ensure_trainers_id();

-- Recreate trigger function without btrim on UUID column
create or replace function ensure_trainers_id()
returns trigger language plpgsql as $$
begin
  if new.id is null then
    new.id := gen_random_uuid();
  end if;
  return new;
end
$$;

create trigger trg_ensure_trainers_id
before insert on trainers
for each row execute function ensure_trainers_id();
