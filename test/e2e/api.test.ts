import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createServer } from '../src/api/server.js';

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

  it('POST /api/bench runs benchmarks and returns report', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/bench',
      payload: { iterations: 5, category: 'hash' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.id).toBeTruthy();
    expect(body.results.length).toBeGreaterThan(0);
    expect(body.iterations).toBe(5);
  });

  it('POST /api/bench defaults to 1000 iterations when not specified', async () => {
    // Use hash category to keep this fast — we just need to verify the default
    const res = await app.inject({
      method: 'POST',
      url: '/api/bench',
      payload: { category: 'hash' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.iterations).toBe(1000);
  });

  it('GET /api/bench/history returns list of past runs', async () => {
    // Run a bench first to populate history
    await app.inject({
      method: 'POST',
      url: '/api/bench',
      payload: { iterations: 5, category: 'hash' },
    });

    const res = await app.inject({ method: 'GET', url: '/api/bench/history' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  it('GET /api/bench/:id returns specific run', async () => {
    const benchRes = await app.inject({
      method: 'POST',
      url: '/api/bench',
      payload: { iterations: 5, category: 'hash' },
    });
    const { id } = benchRes.json();

    const res = await app.inject({ method: 'GET', url: `/api/bench/${id}` });
    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe(id);
  });

  it('GET /api/bench/:id returns 404 for unknown id', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/bench/nonexistent' });
    expect(res.statusCode).toBe(404);
  });

  it('GET /api/reference returns PQC reference data', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/reference' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.results.length).toBeGreaterThan(0);
    expect(body.profiles.length).toBeGreaterThan(0);
    for (const r of body.results) {
      expect(r.isReference).toBe(true);
    }
  });
});
