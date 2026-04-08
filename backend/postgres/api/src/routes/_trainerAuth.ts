import type { IncomingHttpHeaders } from 'node:http';
import type { PoolClient } from 'pg';

export class TrainerAuthError extends Error {}
export class TrainerForbiddenError extends Error {}
export class TrainerTargetNotFoundError extends Error {}

type TrainerAccessIdentity = {
  trainerId: string;
  trainerRef: string;
  organizationId: string | null;
  role: string;
};

export function readTrainerRefHeader(headers: IncomingHttpHeaders): string | null {
  const raw = headers['x-trainer-ref'];
  const value = Array.isArray(raw) ? raw[0] : raw;
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed || null;
}

export async function assertTrainerOwnsSession(
  pool: { query: PoolClient['query'] },
  sessionID: string,
  trainerRef: string
): Promise<void> {
  const result = await pool.query<{ trainer_ref: string | null }>(
    `
      select ss.trainer_ref
      from scenario_sessions ss
      where ss.id = $1::uuid
      limit 1
    `,
    [sessionID]
  );

  if (result.rowCount === 0) {
    throw new TrainerTargetNotFoundError('Session not found.');
  }

  const owner = (result.rows[0].trainer_ref ?? '').trim();
  if (!owner) {
    throw new TrainerForbiddenError('Session has no trainer owner assigned.');
  }
  if (owner.localeCompare(trainerRef, undefined, { sensitivity: 'accent' }) !== 0) {
    throw new TrainerForbiddenError('Trainer does not have access to this session.');
  }
}

export async function assertTrainerCanAccessSession(
  pool: { query: PoolClient['query'] },
  sessionID: string,
  identity: TrainerAccessIdentity
): Promise<void> {
  if (identity.role === 'super_admin') return;

  const result = await pool.query<{
    trainer_id: string | null;
    trainer_ref: string | null;
    organization_id: string | null;
  }>(
    `
      select
        ss.trainer_id::text as trainer_id,
        ss.trainer_ref,
        s.organization_id::text as organization_id
      from scenario_sessions ss
      join scenarios s on s.id = ss.scenario_id
      where ss.id = $1::uuid
      limit 1
    `,
    [sessionID]
  );

  if (result.rowCount === 0) {
    throw new TrainerTargetNotFoundError('Session not found.');
  }

  const row = result.rows[0];
  if (row.trainer_id === identity.trainerId || (row.trainer_ref ?? '').trim().localeCompare(identity.trainerRef, undefined, { sensitivity: 'accent' }) === 0) {
    return;
  }
  if (identity.role === 'org_admin' && row.organization_id && row.organization_id === identity.organizationId) {
    return;
  }

  throw new TrainerForbiddenError('Trainer does not have access to this session.');
}

export async function assertTrainerOwnsScenarioName(
  pool: { query: PoolClient['query'] },
  scenarioName: string,
  trainerRef: string
): Promise<void> {
  const result = await pool.query<{ trainer_ref: string | null }>(
    `
      select s.trainer_ref
      from scenarios s
      where s.scenario_name = $1
      order by s.created_at desc
      limit 1
    `,
    [scenarioName]
  );

  if (result.rowCount === 0) {
    throw new TrainerTargetNotFoundError('Scenario not found.');
  }

  const owner = (result.rows[0].trainer_ref ?? '').trim();
  if (!owner) {
    throw new TrainerForbiddenError('Scenario has no trainer owner assigned.');
  }
  if (owner.localeCompare(trainerRef, undefined, { sensitivity: 'accent' }) !== 0) {
    throw new TrainerForbiddenError('Trainer does not have access to this scenario.');
  }
}

export async function assertTrainerCanAccessScenarioName(
  pool: { query: PoolClient['query'] },
  scenarioName: string,
  identity: TrainerAccessIdentity
): Promise<void> {
  if (identity.role === 'super_admin') return;

  const result = await pool.query<{
    created_by_trainer_id: string | null;
    assigned_trainer_id: string | null;
    organization_id: string | null;
    trainer_ref: string | null;
    visibility: 'private' | 'org_shared' | 'assigned';
  }>(
    `
      select
        s.created_by_trainer_id::text as created_by_trainer_id,
        s.assigned_trainer_id::text as assigned_trainer_id,
        s.organization_id::text as organization_id,
        s.trainer_ref,
        s.visibility::text as visibility
      from scenarios s
      where s.scenario_name = $1
      order by s.created_at desc
      limit 1
    `,
    [scenarioName]
  );

  if (result.rowCount === 0) {
    throw new TrainerTargetNotFoundError('Scenario not found.');
  }

  const row = result.rows[0];
  if (row.created_by_trainer_id === identity.trainerId || (row.trainer_ref ?? '').trim().localeCompare(identity.trainerRef, undefined, { sensitivity: 'accent' }) === 0) {
    return;
  }
  if (identity.role === 'org_admin' && row.organization_id && row.organization_id === identity.organizationId) {
    return;
  }
  if (row.assigned_trainer_id === identity.trainerId) {
    return;
  }
  if (row.organization_id && row.organization_id === identity.organizationId && row.visibility === 'org_shared') {
    return;
  }

  throw new TrainerForbiddenError('Trainer does not have access to this scenario.');
}
