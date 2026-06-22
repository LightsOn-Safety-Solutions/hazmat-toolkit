import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { Pool } from 'pg';

declare module 'fastify' {
  interface FastifyInstance {
    pg: Pool;
  }
}

type DBPluginOptions = {
  connectionString: string;
};

const dbPluginImpl: FastifyPluginAsync<DBPluginOptions> = async (app, opts) => {
  const pool = new Pool({
    connectionString: opts.connectionString,
    connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS || 5000),
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30000),
    statement_timeout: Number(process.env.PG_STATEMENT_TIMEOUT_MS || 10000),
    query_timeout: Number(process.env.PG_QUERY_TIMEOUT_MS || 12000)
  });

  app.decorate('pg', pool);

  app.addHook('onClose', async () => {
    await pool.end();
  });
};

export const dbPlugin = fp(dbPluginImpl, { name: 'db-plugin' });
