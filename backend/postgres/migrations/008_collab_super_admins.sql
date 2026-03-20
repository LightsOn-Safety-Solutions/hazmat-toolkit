create table if not exists collab_super_admins (
  id uuid primary key default gen_random_uuid(),
  trainer_ref text not null unique,
  email text not null unique,
  display_name text not null default 'Super Admin',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_collab_super_admin_email check (position('@' in email) > 1)
);

drop trigger if exists trg_collab_super_admins_updated_at on collab_super_admins;
create trigger trg_collab_super_admins_updated_at
before update on collab_super_admins
for each row execute function set_updated_at();

insert into collab_super_admins (trainer_ref, email, display_name, is_active)
values ('john.holtan@lightsonss.com', 'john.holtan@lightsonss.com', 'John Holtan', true)
on conflict (trainer_ref) do update
set
  email = excluded.email,
  display_name = excluded.display_name,
  is_active = excluded.is_active,
  updated_at = now();
