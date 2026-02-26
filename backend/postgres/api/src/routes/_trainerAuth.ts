import type { IncomingHttpHeaders } from 'node:http';
import type { PoolClient } from 'pg';

export class TrainerAuthError extends Error {}
export class TrainerForbiddenError extends Error {}
export class TrainerTargetNotFoundError extends Error {}

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
