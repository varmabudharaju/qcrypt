import { describe, it, expect } from 'vitest';
import { generateMigrationPlan } from '../../src/migrate/index.js';
import type { ScanReport } from '../../src/types.js';

const mockReport: ScanReport = {
  id: 'test-id', path: '.', scannedAt: new Date().toISOString(),
  filesScanned: 5, findings: [
    { file: 'src/auth.ts', line: 10, algorithm: 'RSA', category: 'asymmetric',
      risk: 'CRITICAL', snippet: "generateKeyPairSync('rsa')", explanation: 'Quantum vulnerable via Shor', replacement: 'ML-KEM (FIPS 203)' },
    { file: 'src/hash.ts', line: 5, algorithm: 'MD5', category: 'hash',
      risk: 'WARNING', snippet: "createHash('md5')", explanation: 'Broken hash', replacement: 'SHA-256' },
    { file: 'src/safe.ts', line: 1, algorithm: 'AES-256', category: 'symmetric',
      risk: 'OK', snippet: "createCipheriv('aes-256-gcm')", explanation: 'Quantum resistant', replacement: 'AES-256' },
  ],
  enrichedFindings: [], summary: { critical: 1, warning: 1, info: 0, ok: 1 },
  grade: 'D', readiness: { overall: 35, dimensions: {
    vulnerability: { score: 50, weighted: 20, details: '' },
    priority: { score: 50, weighted: 12.5, details: '' },
    migration: { score: 10, weighted: 2, details: '' },
    agility: { score: 5, weighted: 0.75, details: '' },
  }},
};

describe('migration planner', () => {
  it('generates steps from CRITICAL and WARNING findings', () => {
    const plan = generateMigrationPlan(mockReport);
    expect(plan.steps.length).toBe(2); // RSA + MD5, not AES-256 (OK)
  });

  it('maps CRITICAL to immediate priority', () => {
    const plan = generateMigrationPlan(mockReport);
    const rsaStep = plan.steps.find((s) => s.finding.algorithm === 'RSA');
    expect(rsaStep?.priority).toBe('immediate');
  });

  it('maps WARNING to short-term priority', () => {
    const plan = generateMigrationPlan(mockReport);
    const md5Step = plan.steps.find((s) => s.finding.algorithm === 'MD5');
    expect(md5Step?.priority).toBe('short-term');
  });

  it('includes code examples for known algorithms', () => {
    const plan = generateMigrationPlan(mockReport);
    const rsaStep = plan.steps.find((s) => s.finding.algorithm === 'RSA');
    expect(rsaStep?.codeExample).toContain('After');
  });

  it('computes summary counts', () => {
    const plan = generateMigrationPlan(mockReport);
    expect(plan.summary.immediate).toBe(1);
    expect(plan.summary.shortTerm).toBe(1);
    expect(plan.summary.longTerm).toBe(0);
  });
});
