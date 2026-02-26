import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import type { AppConfig } from './config.js';
import { dbPlugin } from './plugins/db.js';
import { scenariosRoutes } from './routes/scenarios.js';
import { sessionRoutes } from './routes/sessions.js';
import { watchRoutes } from './routes/watch.js';
import { trackingRoutes } from './routes/tracking.js';

declare module 'fastify' {
  interface FastifyInstance {
    config: AppConfig;
  }
}

export async function buildApp(config: AppConfig): Promise<FastifyInstance> {
  const app = Fastify({
    logger: { level: config.logLevel }
  });

  app.decorate('config', config);

  await app.register(cors, {
    origin: config.corsOrigin === '*' ? true : config.corsOrigin
  });

  await app.register(dbPlugin, { connectionString: config.databaseUrl });

  app.get('/health', async () => ({ status: 'ok', service: 'hazmat-toolkit-api' }));

  app.get('/v1/meta', async () => ({
    service: 'hazmat-toolkit-api',
    apiVersion: 'v1',
    joinCodeTtlMinutes: config.joinCodeTtlMinutes,
    overlapPriorityRule: 'LOWER_SORT_ORDER_WINS'
  }));

  await app.register(scenariosRoutes);
  await app.register(sessionRoutes);
  await app.register(watchRoutes);
  await app.register(trackingRoutes);

  return app;
}
