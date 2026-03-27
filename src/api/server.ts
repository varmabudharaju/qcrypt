import Fastify from 'fastify';
import { scan } from '../index.js';

export function createServer() {
  const app = Fastify({ logger: true });

  app.get('/api/health', async () => {
    return { status: 'ok' };
  });

  app.post<{ Body: { path: string } }>('/api/scan', async (request, reply) => {
    const { path: targetPath } = request.body ?? {};

    if (!targetPath || typeof targetPath !== 'string') {
      return reply.status(400).send({ error: 'Missing required field: path' });
    }

    try {
      const report = await scan(targetPath);
      return report;
    } catch (err) {
      return reply.status(500).send({
        error: err instanceof Error ? err.message : 'Scan failed',
      });
    }
  });

  return app;
}
