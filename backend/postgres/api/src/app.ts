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
    const result = await app.pg.query<{ column_name: string }>(
      `
        select column_name
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'trainers'
      `
    );
    const present = new Set(result.rows.map((row) => row.column_name));
    const missing = REQUIRED_TRAINERS_COLUMNS.filter((column) => !present.has(column));
    if (missing.length) {
      warnings.push(`trainers schema missing required columns: ${missing.join(', ')}`);
    }
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
