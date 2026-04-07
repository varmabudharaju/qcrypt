import { describe, it, expect } from 'vitest';
import { assessCompliance } from '../../src/compliance/assess.js';
import type { ScanReport } from '../../src/types.js';

const mockReport: ScanReport = {
  id: 'test', path: '.', scannedAt: new Date().toISOString(),
  filesScanned: 1, findings: [
    { file: 'a.ts', line: 1, algorithm: 'RSA-2048', category: 'asymmetric', risk: 'CRITICAL', snippet: '', explanation: '', replacement: 'ML-KEM' },
    { file: 'b.ts', line: 1, algorithm: 'MD5', category: 'hash', risk: 'WARNING', snippet: '', explanation: '', replacement: 'SHA-256' },
    { file: 'c.ts', line: 1, algorithm: 'AES-256', category: 'symmetric', risk: 'OK', snippet: '', explanation: '', replacement: 'AES-256' },
  ],
  summary: { critical: 1, warning: 1, info: 0, ok: 1 },
  grade: 'D',
};

describe('compliance assessment', () => {
  it('flags RSA as non-compliant for CNSA 2.0', () => {
    const report = assessCompliance(mockReport);
    const cnsa = report.assessments.find((a) => a.framework.id === 'cnsa-2.0');
    expect(cnsa?.status).toBe('fail');
    expect(cnsa?.summary.nonCompliant).toBeGreaterThan(0);
  });

  it('flags MD5 as non-compliant for FIPS 140-3', () => {
    const report = assessCompliance(mockReport);
    const fips = report.assessments.find((a) => a.framework.id === 'fips-140-3');
    expect(fips?.summary.nonCompliant).toBeGreaterThan(0);
  });

  it('calculates blocking count', () => {
    const report = assessCompliance(mockReport);
    expect(report.blockingCount).toBeGreaterThan(0);
  });
});
