-- Hazmat Toolkit backend (PostgreSQL + PostGIS)
-- Migration 001: Extensions and enum types

create extension if not exists postgis;
create extension if not exists pgcrypto;

DO $$ BEGIN
  CREATE TYPE device_type AS ENUM ('air_monitor', 'radiation_detection', 'ph_paper');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE shape_kind AS ENUM ('polygon', 'circle', 'point');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE scenario_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE session_status AS ENUM ('scheduled', 'live', 'ended', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
