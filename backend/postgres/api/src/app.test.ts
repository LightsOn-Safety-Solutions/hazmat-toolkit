import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeStartupSchemaWarnings, type SchemaColumnRow } from './app.js';

test('warns when trainer-related id columns are not uuid typed', () => {
  const rows: SchemaColumnRow[] = [
    { table_name: 'trainers', column_name: 'id', data_type: 'text', udt_name: 'text' },
    { table_name: 'trainers', column_name: 'trainer_ref', data_type: 'text', udt_name: 'text' },
    { table_name: 'trainers', column_name: 'display_name', data_type: 'text', udt_name: 'text' },
    { table_name: 'trainers', column_name: 'name', data_type: 'text', udt_name: 'text' },
    { table_name: 'trainers', column_name: 'email', data_type: 'text', udt_name: 'text' },
    { table_name: 'trainers', column_name: 'is_active', data_type: 'boolean', udt_name: 'bool' },
    { table_name: 'scenarios', column_name: 'trainer_id', data_type: 'uuid', udt_name: 'uuid' },
    { table_name: 'scenarios', column_name: 'created_by_trainer_id', data_type: 'text', udt_name: 'text' },
    { table_name: 'scenarios', column_name: 'assigned_trainer_id', data_type: 'uuid', udt_name: 'uuid' },
    { table_name: 'scenario_sessions', column_name: 'trainer_id', data_type: 'uuid', udt_name: 'uuid' },
    { table_name: 'organization_memberships', column_name: 'trainer_id', data_type: 'uuid', udt_name: 'uuid' },
    { table_name: 'trainer_entitlements', column_name: 'trainer_id', data_type: 'uuid', udt_name: 'uuid' }
  ];

  assert.deepEqual(summarizeStartupSchemaWarnings(rows), [
    'schema type mismatch: trainers.id should be uuid, found text/text',
    'schema type mismatch: scenarios.created_by_trainer_id should be uuid, found text/text'
  ]);
});

test('warns when required trainers columns are missing', () => {
  const rows: SchemaColumnRow[] = [
    { table_name: 'trainers', column_name: 'id', data_type: 'uuid', udt_name: 'uuid' },
    { table_name: 'trainers', column_name: 'trainer_ref', data_type: 'text', udt_name: 'text' }
  ];

  assert.deepEqual(summarizeStartupSchemaWarnings(rows), [
    'trainers schema missing required columns: display_name, name, email, is_active'
  ]);
});
