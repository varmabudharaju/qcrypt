import { describe, it, expect } from 'vitest';
import { computeAgilityScore } from '../src/analyzers/agility.js';
import type { EnrichedFinding } from '../src/types.js';

const makeFinding = (file: string): EnrichedFinding => ({
  file,
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
});

describe('computeAgilityScore', () => {
  it('returns 100 when crypto is in 1-2 files', () => {
    const findings = [makeFinding('src/crypto.ts'), makeFinding('src/crypto.ts')];
    expect(computeAgilityScore(findings).score).toBe(100);
  });

  it('returns 75 when crypto is in 3-5 files', () => {
    const findings = [
      makeFinding('a.ts'), makeFinding('b.ts'), makeFinding('c.ts'),
    ];
    expect(computeAgilityScore(findings).score).toBe(75);
  });

  it('returns 50 when crypto is in 6-10 files', () => {
    const findings = Array.from({ length: 7 }, (_, i) => makeFinding(`f${i}.ts`));
    expect(computeAgilityScore(findings).score).toBe(50);
  });

  it('returns 25 when crypto is in 11-20 files', () => {
    const findings = Array.from({ length: 15 }, (_, i) => makeFinding(`f${i}.ts`));
    expect(computeAgilityScore(findings).score).toBe(25);
  });

  it('returns 10 when crypto is in 21+ files', () => {
    const findings = Array.from({ length: 25 }, (_, i) => makeFinding(`f${i}.ts`));
    expect(computeAgilityScore(findings).score).toBe(10);
  });

  it('returns 100 when no findings', () => {
    expect(computeAgilityScore([]).score).toBe(100);
  });

  it('weighted is score * 0.15', () => {
    const findings = [makeFinding('a.ts')];
    const result = computeAgilityScore(findings);
    expect(result.weighted).toBe(15);
  });
});
