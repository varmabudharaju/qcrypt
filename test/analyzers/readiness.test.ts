import { describe, it, expect } from 'vitest';
import { computeReadinessScore } from '../src/analyzers/readiness.js';
import type { EnrichedFinding } from '../src/types.js';

const makeFinding = (
  overrides: Partial<EnrichedFinding> & { file?: string; algorithm?: string; risk?: any },
): EnrichedFinding => ({
  file: 'src/app.ts',
  line: 1,
  algorithm: 'RSA',
  category: 'asymmetric',
  risk: 'CRITICAL',
  snippet: '',
  explanation: '',
  replacement: '',
  context: {
    sensitivity: 'medium',
    hndlRisk: false,
    isTestFile: false,
    migrationEffort: 'medium',
  },
  ...overrides,
});

describe('computeReadinessScore', () => {
  it('returns perfect score for no findings', () => {
    const result = computeReadinessScore([], 100);
    expect(result.overall).toBe(100);
    expect(result.dimensions.vulnerability.score).toBe(100);
  });

  it('returns low score for many critical findings', () => {
    const findings = Array.from({ length: 10 }, (_, i) =>
      makeFinding({ file: `f${i}.ts` }),
    );
    const result = computeReadinessScore(findings, 100);
    expect(result.overall).toBeLessThan(50);
  });

  it('test file findings do not affect vulnerability score', () => {
    const prodFinding = makeFinding({});
    const testFinding = makeFinding({
      file: 'test/crypto.test.ts',
      context: {
        sensitivity: 'low',
        hndlRisk: false,
        isTestFile: true,
        migrationEffort: 'medium',
      },
    });

    const prodOnly = computeReadinessScore([prodFinding], 100);
    const withTest = computeReadinessScore([prodFinding, testFinding], 100);

    expect(prodOnly.dimensions.vulnerability.score)
      .toBe(withTest.dimensions.vulnerability.score);
  });

  it('HNDL findings reduce priority score more', () => {
    const noHndl = makeFinding({
      algorithm: 'ECDSA',
      context: {
        sensitivity: 'medium',
        hndlRisk: false,
        isTestFile: false,
        migrationEffort: 'medium',
      },
    });
    const hndl = makeFinding({
      algorithm: 'ECDH',
      context: {
        sensitivity: 'medium',
        hndlRisk: true,
        isTestFile: false,
        migrationEffort: 'high',
      },
    });

    const noHndlResult = computeReadinessScore([noHndl], 100);
    const hndlResult = computeReadinessScore([hndl], 100);

    expect(hndlResult.dimensions.priority.score)
      .toBeLessThan(noHndlResult.dimensions.priority.score);
  });

  it('overall is sum of all weighted dimensions', () => {
    const result = computeReadinessScore([], 100);
    const sum =
      result.dimensions.vulnerability.weighted +
      result.dimensions.priority.weighted +
      result.dimensions.migration.weighted +
      result.dimensions.agility.weighted;
    expect(result.overall).toBe(Math.round(sum));
  });

  it('normalizes vulnerability by filesScanned', () => {
    const findings = [makeFinding({})];
    const small = computeReadinessScore(findings, 10);
    const large = computeReadinessScore(findings, 10000);

    expect(large.dimensions.vulnerability.score)
      .toBeGreaterThan(small.dimensions.vulnerability.score);
  });
});
