import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';

export function createServer(): FastifyInstance {
  const app = Fastify({ logger: true });

  app.get('/api/health', async () => ({ status: 'ok' }));

  return app;
}
