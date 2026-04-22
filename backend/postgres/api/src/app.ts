import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import type { AppConfig } from './config.js';
import { dbPlugin } from './plugins/db.js';
import { scenariosRoutes } from './routes/scenarios.js';
import { sessionRoutes } from './routes/sessions.js';
import { watchRoutes } from './routes/watch.js';
import { trackingRoutes } from './routes/tracking.js';
import { authRoutes } from './routes/auth.js';
import { organizationRoutes } from './routes/organizations.js';
import { adminRoutes } from './routes/admin.js';
import { collabRoutes } from './routes/ics-collaborative-map/index.js';

declare module 'fastify' {
  interface FastifyInstance {
    config: AppConfig;
    startupWarnings: string[];
  }
}

const REQUIRED_TRAINERS_COLUMNS = [
  'id',
  'trainer_ref',
  'display_name',
  'name',
  'email',
  'is_active'
] as const;

const REQUIRED_UUID_COLUMNS = [
  ['trainers', 'id'],
  ['scenarios', 'created_by_trainer_id'],
  ['scenarios', 'assigned_trainer_id'],
  ['scenarios', 'trainer_id'],
  ['scenario_sessions', 'trainer_id'],
  ['organization_memberships', 'trainer_id'],
  ['trainer_entitlements', 'trainer_id']
] as const;

export type SchemaColumnRow = {
  table_name: string;
  column_name: string;
  data_type: string;
  udt_name: string;
};

export function summarizeStartupSchemaWarnings(rows: SchemaColumnRow[]): string[] {
  const warnings: string[] = [];
  const present = new Set(rows.map((row) => `${row.table_name}.${row.column_name}`));

  const missingTrainerColumns = REQUIRED_TRAINERS_COLUMNS.filter((column) => !present.has(`trainers.${column}`));
  if (missingTrainerColumns.length) {
    warnings.push(`trainers schema missing required columns: ${missingTrainerColumns.join(', ')}`);
  }

  for (const [tableName, columnName] of REQUIRED_UUID_COLUMNS) {
    const match = rows.find((row) => row.table_name === tableName && row.column_name === columnName);
    if (match && (match.data_type !== 'uuid' || match.udt_name !== 'uuid')) {
      warnings.push(
        `schema type mismatch: ${tableName}.${columnName} should be uuid, found ${match.data_type}/${match.udt_name}`
      );
    }
  }

  return warnings;
}

export async function buildApp(config: AppConfig): Promise<FastifyInstance> {
  const app = Fastify({
    logger: { level: config.logLevel }
  });

  app.decorate('config', config);
  app.decorate('startupWarnings', []);

  await app.register(cors, {
    origin: config.corsOrigin === '*' ? true : config.corsOrigin
  });

  await app.register(dbPlugin, { connectionString: config.databaseUrl });

  await runStartupSchemaChecks(app);

  app.get('/health', async () => ({
    status: 'ok',
    service: 'hazmat-toolkit-api',
    ...(app.startupWarnings.length ? { warnings: app.startupWarnings } : {})
  }));

  app.get('/v1/meta', async () => ({
    service: 'hazmat-toolkit-api',
    apiVersion: 'v1',
    joinCodeTtlMinutes: config.joinCodeTtlMinutes,
    overlapPriorityRule: 'LOWER_SORT_ORDER_WINS'
  }));

  await app.register(authRoutes);
  await app.register(organizationRoutes);
  await app.register(adminRoutes);
  await app.register(scenariosRoutes);
  await app.register(sessionRoutes);
  await app.register(watchRoutes);
  await app.register(trackingRoutes);
  await app.register(collabRoutes);

  return app;
}

async function runStartupSchemaChecks(app: FastifyInstance) {
  const warnings: string[] = [];
  try {
    const result = await app.pg.query<SchemaColumnRow>(
      `
        select table_name, column_name, data_type, udt_name
        from information_schema.columns
        where table_schema = 'public'
          and (
            table_name = 'trainers'
            or (table_name = 'scenarios' and column_name in ('created_by_trainer_id', 'assigned_trainer_id', 'trainer_id'))
            or (table_name = 'scenario_sessions' and column_name = 'trainer_id')
            or (table_name = 'organization_memberships' and column_name = 'trainer_id')
            or (table_name = 'trainer_entitlements' and column_name = 'trainer_id')
          )
      `
    );
    warnings.push(...summarizeStartupSchemaWarnings(result.rows));
  } catch (error) {
    warnings.push('unable to validate trainers schema at startup');
    app.log.warn({ err: error }, 'Startup schema check failed.');
  }

  if (warnings.length) {
    app.startupWarnings = warnings;
    app.log.warn({ warnings }, 'Startup schema warnings detected.');
  } else {
    app.startupWarnings = [];
  }
}
