import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import { scan } from '../index.js';
import { runBenchmarks } from '../benchmarks/index.js';
import { getPqcReferenceResults, getPqcProfiles } from '../reference/pqc-data.js';
import { generateMigrationPlan } from '../migrate/index.js';
import { getDb } from '../db/index.js';
import { createProject, listProjectsWithLatestScan, getProjectWithScans, deleteProject, findProjectByPath } from '../db/projects.js';
import { createScan, getScanWithDetails, getOverviewStats } from '../db/scans.js';
import { FRAMEWORKS, assessCompliance } from '../compliance/index.js';
import { generateHtmlReport } from '../report/index.js';
import type { BenchmarkCategory, BenchmarkReport, ScanReport, MigrationPlan } from '../types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createServer(): FastifyInstance {
  const app = Fastify({ logger: true });

  const benchHistory: BenchmarkReport[] = [];

  // Rate limiting
  app.register(rateLimit, { max: 100, timeWindow: '1 minute' });

  // CORS — restrict to localhost origins only
  app.addHook('onSend', async (request, reply) => {
    const origin = request.headers.origin ?? '';
    if (/^https?:\/\/localhost(:\d+)?$/.test(origin) || /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
      reply.header('Access-Control-Allow-Origin', origin);
    }
    reply.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Content-Type');
  });

  app.get('/api/health', async () => ({ status: 'ok' }));

  // ── Scan routes ──

  app.post<{ Body: { path: string } }>('/api/scan', async (request, reply) => {
    const targetPath = request.body?.path;
    if (!targetPath || typeof targetPath !== 'string') {
      return reply.status(400).send({ error: 'Missing required field: path' });
    }

    try {
      const scanReport = await scan(targetPath);
      const plan = generateMigrationPlan(scanReport);

      // Persist to DB (handle concurrent creation via UNIQUE constraint)
      const db = getDb();
      const projectPath = scanReport.path;
      let project = findProjectByPath(db, projectPath);
      if (!project) {
        try {
          const name = projectPath.split('/').pop() || path.basename(projectPath);
          project = createProject(db, projectPath, name);
        } catch {
          project = findProjectByPath(db, projectPath)!;
        }
      }
      const scanRow = createScan(db, project.id, scanReport, plan);

      return { project, scan: { id: scanRow.id, grade: scanRow.grade, scanned_at: scanRow.scanned_at }, report: scanReport, plan };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Scan failed';
      app.log.error(err, 'Scan failed');
      return reply.status(500).send({ error: message });
    }
  });

  app.get<{ Params: { id: string } }>('/api/scans/:id', async (request, reply) => {
    const db = getDb();
    const scanRow = getScanWithDetails(db, request.params.id);
    if (!scanRow) {
      return reply.status(404).send({ error: 'Scan not found' });
    }
    return {
      ...scanRow,
      report: JSON.parse(scanRow.report_json),
      plan: JSON.parse(scanRow.plan_json),
    };
  });

  // ── Benchmark routes ──

  app.post<{ Body: { iterations?: number; category?: string } }>('/api/bench', async (request) => {
    const iterations = Math.min(Math.max(request.body?.iterations ?? 1000, 1), 50_000);
    const category = (request.body?.category ?? 'all') as BenchmarkCategory;
    const report = runBenchmarks({ iterations, category });
    benchHistory.unshift(report);
    if (benchHistory.length > 50) benchHistory.length = 50;
    return report;
  });

  app.get('/api/bench/history', async () => benchHistory);

  app.get<{ Params: { id: string } }>('/api/bench/:id', async (request, reply) => {
    const report = benchHistory.find((r) => r.id === request.params.id);
    if (!report) return reply.status(404).send({ error: 'Not found' });
    return report;
  });

  app.get('/api/reference', async () => ({
    results: getPqcReferenceResults(),
    profiles: getPqcProfiles(),
  }));

  // ── Migration routes ──

  app.post<{ Body: { path?: string } }>('/api/migrate', async (request) => {
    const targetPath = request.body?.path || '.';
    const scanReport = await scan(targetPath);
    const plan = generateMigrationPlan(scanReport);
    return plan;
  });

  // ── Browse routes (for folder picker) ──

  app.get<{ Querystring: { path?: string } }>('/api/browse', async (request, reply) => {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '/';
    const targetPath = path.resolve(request.query.path || homeDir);

    // Prevent path traversal outside home directory
    if (!targetPath.startsWith(homeDir)) {
      return reply.status(403).send({ error: 'Access denied' });
    }

    try {
      const stat = fs.statSync(targetPath);
      if (!stat.isDirectory()) {
        return reply.status(400).send({ error: 'Not a directory' });
      }
      const entries = fs.readdirSync(targetPath, { withFileTypes: true })
        .filter((e) => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules' && e.name !== 'dist')
        .map((e) => e.name)
        .sort();
      return { path: targetPath, parent: path.dirname(targetPath), entries };
    } catch {
      return reply.status(400).send({ error: 'Cannot read directory' });
    }
  });

  // ── Project routes ──

  app.get('/api/projects', async () => {
    const db = getDb();
    return listProjectsWithLatestScan(db);
  });

  app.get<{ Params: { id: string } }>('/api/projects/:id', async (request, reply) => {
    const db = getDb();
    const detail = getProjectWithScans(db, request.params.id);
    if (!detail) return reply.status(404).send({ error: 'Project not found' });
    return detail;
  });

  app.delete<{ Params: { id: string } }>('/api/projects/:id', async (request, reply) => {
    const db = getDb();
    const deleted = deleteProject(db, request.params.id);
    if (!deleted) return reply.status(404).send({ error: 'Project not found' });
    return { ok: true };
  });

  app.post<{ Params: { id: string } }>('/api/projects/:id/scan', async (request, reply) => {
    const db = getDb();
    const detail = getProjectWithScans(db, request.params.id);
    if (!detail) return reply.status(404).send({ error: 'Project not found' });

    const scanReport = await scan(detail.project.path);
    const plan = generateMigrationPlan(scanReport);
    const scanRow = createScan(db, detail.project.id, scanReport, plan);

    return { project: detail.project, scan: { id: scanRow.id, grade: scanRow.grade, scanned_at: scanRow.scanned_at }, plan };
  });

  app.get('/api/overview', async () => {
    const db = getDb();
    return getOverviewStats(db);
  });

  // ── Compliance routes ──

  app.get('/api/compliance/frameworks', async () => FRAMEWORKS);

  app.get<{ Params: { scanId: string } }>('/api/compliance/assess/:scanId', async (request, reply) => {
    const db = getDb();
    const scanRow = getScanWithDetails(db, request.params.scanId);
    if (!scanRow) return reply.status(404).send({ error: 'Scan not found' });
    const report = JSON.parse(scanRow.report_json) as ScanReport;
    return assessCompliance(report);
  });

  // ── Report routes ──

  app.get<{ Params: { scanId: string } }>('/api/reports/:scanId/html', async (request, reply) => {
    const db = getDb();
    const scanRow = getScanWithDetails(db, request.params.scanId);
    if (!scanRow) return reply.status(404).send({ error: 'Scan not found' });

    const scanReport = JSON.parse(scanRow.report_json) as ScanReport;
    const migrationPlan = JSON.parse(scanRow.plan_json) as MigrationPlan;
    const complianceReport = assessCompliance(scanReport);
    const projectName = scanReport.path.split('/').pop() || 'project';
    const date = scanReport.scannedAt.split('T')[0];

    const html = generateHtmlReport({ scanReport, migrationPlan, complianceReport });

    reply.header('Content-Type', 'text/html');
    reply.header('Content-Disposition', `attachment; filename="qcrypt-report-${projectName}-${date}.html"`);
    return html;
  });

  // Serve web UI static files
  const webDist = path.resolve(__dirname, '../../web/dist');
  if (fs.existsSync(webDist)) {
    app.register(fastifyStatic, {
      root: webDist,
      prefix: '/',
      wildcard: false,
    });

    app.setNotFoundHandler(async (request, reply) => {
      if (request.url.startsWith('/api/')) {
        return reply.status(404).send({ error: 'Not found' });
      }
      return reply.sendFile('index.html');
    });
  } else {
    app.setNotFoundHandler(async (request, reply) => {
      if (request.url.startsWith('/api/')) {
        return reply.status(404).send({ error: 'Not found' });
      }
      return reply.status(503).type('text/plain').send(
        'qcrypt web UI is not built.\n\n' +
        'Run `npm run build:web` from the repo root, then restart `--serve`.\n' +
        'API endpoints under /api/ are still available.\n'
      );
    });
  }

  return app;
}

const isMain =
  process.argv[1] != null &&
  fileURLToPath(import.meta.url).endsWith(process.argv[1].replace(/\\/g, '/'));

if (isMain) {
  const app = createServer();
  app.listen({ port: 3100, host: '0.0.0.0' }, (err, address) => {
    if (err) { console.error(err); process.exit(1); }
    console.log(`Quantum Sentry running at ${address}`);
  });
}
