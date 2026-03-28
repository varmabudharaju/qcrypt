import { describe, it, expect } from 'vitest';
import type {
  BenchmarkResult,
  AlgorithmProfile,
  BenchmarkReport,
  Comparison,
  BenchmarkCategory,
} from '../src/types.js';

describe('Core types', () => {
  it('BenchmarkResult accepts valid data', () => {
    const result: BenchmarkResult = {
      algorithm: 'RSA-2048',
      operation: 'keygen',
      opsPerSecond: 500,
      avgTimeMs: 2.0,
      iterations: 1000,
      isReference: false,
      quantumSafe: false,
    };
    expect(result.algorithm).toBe('RSA-2048');
    expect(result.isReference).toBe(false);
  });

  it('AlgorithmProfile accepts valid data', () => {
    const profile: AlgorithmProfile = {
      algorithm: 'ML-KEM-768',
      category: 'asymmetric',
      quantumSafe: true,
      publicKeySize: 1184,
      privateKeySize: 2400,
      ciphertextSize: 1088,
      securityLevel: '128-bit classical, 128-bit quantum',
    };
    expect(profile.quantumSafe).toBe(true);
    expect(profile.signatureSize).toBeUndefined();
  });

  it('BenchmarkReport has all required fields', () => {
    const report: BenchmarkReport = {
      id: 'test-id',
      runAt: '2026-03-27T00:00:00Z',
      platform: { os: 'darwin', arch: 'arm64', node: '20.0.0', cpuModel: 'Apple M1' },
      iterations: 1000,
      results: [],
      profiles: [],
      comparisons: [],
    };
    expect(report.id).toBe('test-id');
    expect(report.results).toEqual([]);
  });

  it('Comparison has all required fields', () => {
    const comparison: Comparison = {
      classical: 'RSA-2048',
      postQuantum: 'ML-KEM-768',
      speedup: 'ML-KEM is 1125x faster at key generation',
      sizeTradeoff: 'but public keys are 4x larger (1184B vs 294B)',
      explanation: 'RSA relies on factoring large primes...',
    };
    expect(comparison.classical).toBe('RSA-2048');
  });

  it('BenchmarkCategory covers all categories', () => {
    const categories: BenchmarkCategory[] = ['all', 'kex', 'sigs', 'sym', 'hash'];
    expect(categories).toHaveLength(5);
  });
});
