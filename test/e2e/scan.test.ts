import { describe, it, expect } from 'vitest';
import { scan } from '../../src/index.js';

describe('E2E: scan pipeline', () => {
  it('detects all critical findings in vulnerable fixtures', async () => {
    const report = await scan('test/fixtures/vulnerable');
    expect(report.summary.critical).toBeGreaterThanOrEqual(3);
    expect(report.findings.some((f) => f.algorithm === 'RSA')).toBe(true);
    expect(report.findings.some((f) => f.algorithm === 'ECDSA')).toBe(true);
    expect(report.grade).not.toBe('A');
    expect(report.grade).not.toBe('B');
  });

  it('detects warning-level findings in vulnerable fixtures', async () => {
    const report = await scan('test/fixtures/vulnerable');
    expect(report.summary.warning).toBeGreaterThanOrEqual(1);
    expect(report.findings.some((f) => f.algorithm === 'MD5' || f.algorithm === 'DES')).toBe(true);
  });

  it('reports grade A for safe fixtures', async () => {
    const report = await scan('test/fixtures/safe');
    expect(report.summary.critical).toBe(0);
    expect(report.summary.warning).toBe(0);
    expect(report.grade).toBe('A');
  });

  it('handles mixed fixtures correctly', async () => {
    const report = await scan('test/fixtures/mixed');
    expect(report.summary.critical).toBeGreaterThanOrEqual(1);
    expect(report.findings.some((f) => f.risk === 'CRITICAL')).toBe(true);
    const hasRSA = report.findings.some((f) => f.algorithm === 'RSA');
    expect(hasRSA).toBe(true);
  });

  it('includes educational explanations in all findings', async () => {
    const report = await scan('test/fixtures/vulnerable');
    for (const finding of report.findings) {
      expect(finding.explanation.length).toBeGreaterThan(0);
      expect(finding.replacement.length).toBeGreaterThan(0);
    }
  });

  it('includes file paths and line numbers', async () => {
    const report = await scan('test/fixtures/vulnerable');
    for (const finding of report.findings) {
      expect(finding.file.length).toBeGreaterThan(0);
      expect(finding.line).toBeGreaterThanOrEqual(1);
    }
  });

  it('sorts findings by risk level (CRITICAL first)', async () => {
    const report = await scan('test/fixtures/vulnerable');
    const risks = report.findings.map((f) => f.risk);
    const riskOrder = { CRITICAL: 0, WARNING: 1, INFO: 2, OK: 3 };
    for (let i = 1; i < risks.length; i++) {
      expect(riskOrder[risks[i]]).toBeGreaterThanOrEqual(riskOrder[risks[i - 1]]);
    }
  });
});
