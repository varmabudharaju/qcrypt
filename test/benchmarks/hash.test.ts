import { describe, it, expect } from 'vitest';
import { getHashBenchmarks } from '../src/benchmarks/hash.js';

describe('hash benchmarks', () => {
  it('returns results for all hash algorithms', () => {
    const results = getHashBenchmarks(10);
    const algorithms = results.map((r) => r.algorithm);

    expect(algorithms).toContain('MD5');
    expect(algorithms).toContain('SHA-256');
    expect(algorithms).toContain('SHA-512');
    expect(algorithms).toContain('SHA3-256');
  });

  it('all results have operation hash', () => {
    const results = getHashBenchmarks(10);
    for (const r of results) {
      expect(r.operation).toBe('hash');
    }
  });

  it('all results are local and not quantum safe', () => {
    const results = getHashBenchmarks(10);
    for (const r of results) {
      expect(r.isReference).toBe(false);
      expect(r.quantumSafe).toBe(false);
    }
  });

  it('each result has positive timing values', () => {
    const results = getHashBenchmarks(10);
    for (const r of results) {
      expect(r.opsPerSecond).toBeGreaterThan(0);
      expect(r.avgTimeMs).toBeGreaterThan(0);
      expect(r.iterations).toBe(10);
    }
  });
});
