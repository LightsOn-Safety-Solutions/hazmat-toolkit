import type { FastifyReply, FastifyRequest } from 'fastify';

export function notImplemented(operation: string) {
  return async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.code(501).send({
      error: 'NOT_IMPLEMENTED',
      operation,
      message: `TODO: implement ${operation}`
    });
  };
}
