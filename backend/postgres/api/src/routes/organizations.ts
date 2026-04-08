import type { FastifyPluginAsync } from 'fastify';
import { requireTrainerIdentity } from './_trainerIdentity.js';

export const organizationRoutes: FastifyPluginAsync = async (app) => {
  app.get('/v1/organizations/me', async (request, reply) => {
    try {
      const identity = await requireTrainerIdentity(app, request.headers);
      const memberships = await app.pg.query<{
        organization_id: string;
        organization_name: string;
        role: string;
        is_active: boolean;
      }>(
        `
          select
            o.id::text as organization_id,
            o.organization_name,
            m.role::text as role,
            m.is_active
          from organization_memberships m
          join organizations o on o.id = m.organization_id
          where m.trainer_id = $1::uuid
          order by m.created_at asc
        `,
        [identity.trainerId]
      );

      return reply.send({
        currentOrganization: {
          id: identity.organizationId,
          organizationName: identity.organizationName,
          role: identity.role
        },
        organizations: memberships.rows.map((row) => ({
          id: row.organization_id,
          organizationName: row.organization_name,
          role: row.role,
          isActive: row.is_active
        }))
      });
    } catch (error) {
      request.log.error({ err: error }, 'organizations me failed');
      return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'Trainer authentication is required.' });
    }
  });
};
