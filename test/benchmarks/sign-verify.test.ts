import { describe, it, expect } from 'vitest';
import { getSignVerifyBenchmarks } from '../src/benchmarks/sign-verify.js';

describe('sign/verify benchmarks', () => {
  it('returns results for all signature algorithms and operations', () => {
    const results = getSignVerifyBenchmarks(10);
    const keys = results.map((r) => `${r.algorithm}:${r.operation}`);

    expect(keys).toContain('RSA-2048:sign');
    expect(keys).toContain('RSA-2048:verify');
    expect(keys).toContain('ECDSA-P256:sign');
    expect(keys).toContain('ECDSA-P256:verify');
    expect(keys).toContain('Ed25519:sign');
    expect(keys).toContain('Ed25519:verify');
    // keygen is NOT included here — it's benchmarked in keygen.ts to avoid duplication
  });

  it('all results are local and not quantum safe', () => {
    const results = getSignVerifyBenchmarks(10);
    for (const r of results) {
      expect(r.isReference).toBe(false);
      expect(r.quantumSafe).toBe(false);
    }
  });

  it('each result has positive timing values', () => {
    const results = getSignVerifyBenchmarks(10);
    for (const r of results) {
      expect(r.opsPerSecond).toBeGreaterThan(0);
      expect(r.avgTimeMs).toBeGreaterThan(0);
      expect(r.iterations).toBe(10);
    }
  });
});
