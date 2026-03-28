import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import type { FastifyInstance } from 'fastify';
import { runBenchmarks } from '../index.js';
import { getPqcReferenceResults, getPqcProfiles } from '../reference/pqc-data.js';
import type { BenchmarkCategory, BenchmarkReport } from '../types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createServer(): FastifyInstance {
  const app = Fastify({ logger: true });

  const history: BenchmarkReport[] = [];

  // CORS for development
  app.addHook('onSend', async (_request, reply) => {
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Content-Type');
  });

  app.get('/api/health', async () => ({ status: 'ok' }));

  app.post<{ Body: { iterations?: number; category?: string } }>(
    '/api/bench',
    async (request) => {
      const iterations = request.body?.iterations ?? 1000;
      const category = (request.body?.category ?? 'all') as BenchmarkCategory;

      const report = runBenchmarks({ iterations, category });
      history.unshift(report);
      return report;
    },
  );

  app.get('/api/bench/history', async () => history);

  app.get<{ Params: { id: string } }>('/api/bench/:id', async (request, reply) => {
    const report = history.find((r) => r.id === request.params.id);
    if (!report) {
      reply.code(404);
      return { error: 'Not found' };
    }
    return report;
  });

  app.get('/api/reference', async () => ({
    results: getPqcReferenceResults(),
    profiles: getPqcProfiles(),
  }));

  // Serve web UI static files if built
  const webDist = path.resolve(__dirname, '../../web/dist');
  if (fs.existsSync(webDist)) {
    app.register(fastifyStatic, {
      root: webDist,
      prefix: '/',
    });

    // SPA fallback — serve index.html for non-API routes
    app.setNotFoundHandler(async (request, reply) => {
      if (request.url.startsWith('/api/')) {
        reply.code(404);
        return { error: 'Not found' };
      }
      return reply.sendFile('index.html');
    });
  }

  return app;
}
