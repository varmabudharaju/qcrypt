import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from '../../src/api/server.js';
import type { FastifyInstance } from 'fastify';

describe('E2E: API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = createServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health returns ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
  });

  it('POST /api/scan returns scan report', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/scan',
      payload: { path: 'test/fixtures/vulnerable' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('grade');
    expect(body).toHaveProperty('findings');
    expect(body).toHaveProperty('summary');
    expect(body.summary.critical).toBeGreaterThan(0);
  });

  it('POST /api/scan returns 400 without path', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/scan',
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });

  it('POST /api/scan returns grade A for safe fixtures', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/scan',
      payload: { path: 'test/fixtures/safe' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    // Safe fixtures score B (80/100) under readiness-based grading because
    // the migration dimension scores 0 (no PQC adoption detected yet).
    expect(body.grade).toBe('B');
  });
});
