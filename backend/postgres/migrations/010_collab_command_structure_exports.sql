alter table collab_map_sessions
  add column if not exists command_structure_json jsonb,
  add column if not exists ics207_export_json jsonb;
