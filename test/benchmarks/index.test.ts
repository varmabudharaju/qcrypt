import { describe, it, expect } from 'vitest';
import { runBenchmarks } from '../../src/benchmarks/index.js';

describe('benchmarks', () => {
  it('runs hash benchmarks with low iterations', () => {
    const report = runBenchmarks({ iterations: 10, category: 'hash' });
    expect(report.results.length).toBeGreaterThan(0);
    expect(report.results[0].operation).toBe('hash');
  });

  it('includes PQC reference data for kex category', () => {
    const report = runBenchmarks({ iterations: 10, category: 'kex' });
    const refs = report.results.filter((r) => r.isReference);
    expect(refs.length).toBeGreaterThan(0);
  });

  it('includes comparisons and profiles', () => {
    const report = runBenchmarks({ iterations: 10, category: 'all' });
    expect(report.comparisons.length).toBeGreaterThan(0);
    expect(report.profiles.length).toBeGreaterThan(0);
  });

  it('filters PQC results by category', () => {
    const symReport = runBenchmarks({ iterations: 10, category: 'sym' });
    const refResults = symReport.results.filter((r) => r.isReference);
    expect(refResults.length).toBe(0);
  });
});
