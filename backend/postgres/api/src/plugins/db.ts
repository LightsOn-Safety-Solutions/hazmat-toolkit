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
  const pool = new Pool({ connectionString: opts.connectionString });

  app.decorate('pg', pool);

  app.addHook('onClose', async () => {
    await pool.end();
  });
};

export const dbPlugin = fp(dbPluginImpl, { name: 'db-plugin' });
