-- Migration 018: Add Air Monitor sampling-height configuration fields
-- Adds support for trainer-configurable high and low sampling band adjustments

alter table scenario_shapes add column if not exists oxygen_high_sampling_mode text;
alter table scenario_shapes add column if not exists oxygen_high_feather_percent numeric;
alter table scenario_shapes add column if not exists oxygen_low_sampling_mode text;
alter table scenario_shapes add column if not exists oxygen_low_feather_percent numeric;

alter table scenario_shapes add column if not exists lel_high_sampling_mode text;
alter table scenario_shapes add column if not exists lel_high_feather_percent numeric;
alter table scenario_shapes add column if not exists lel_low_sampling_mode text;
alter table scenario_shapes add column if not exists lel_low_feather_percent numeric;

alter table scenario_shapes add column if not exists carbon_monoxide_high_sampling_mode text;
alter table scenario_shapes add column if not exists carbon_monoxide_high_feather_percent numeric;
alter table scenario_shapes add column if not exists carbon_monoxide_low_sampling_mode text;
alter table scenario_shapes add column if not exists carbon_monoxide_low_feather_percent numeric;

alter table scenario_shapes add column if not exists hydrogen_sulfide_high_sampling_mode text;
alter table scenario_shapes add column if not exists hydrogen_sulfide_high_feather_percent numeric;
alter table scenario_shapes add column if not exists hydrogen_sulfide_low_sampling_mode text;
alter table scenario_shapes add column if not exists hydrogen_sulfide_low_feather_percent numeric;

alter table scenario_shapes add column if not exists pid_high_sampling_mode text;
alter table scenario_shapes add column if not exists pid_high_feather_percent numeric;
alter table scenario_shapes add column if not exists pid_low_sampling_mode text;
alter table scenario_shapes add column if not exists pid_low_feather_percent numeric;
