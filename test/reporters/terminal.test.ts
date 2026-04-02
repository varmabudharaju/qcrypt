import { describe, it, expect } from 'vitest';
import { formatTerminal } from '../src/reporters/terminal.js';
import type { ScanReport } from '../src/types.js';

const makeReport = (overrides?: Partial<ScanReport>): ScanReport => ({
  id: 'test-id',
  path: './test-project',
  scannedAt: '2026-04-02T00:00:00.000Z',
  filesScanned: 100,
  findings: [
    {
      file: 'src/auth.ts',
      line: 42,
      algorithm: 'RSA',
      category: 'asymmetric',
      risk: 'CRITICAL',
      snippet: 'rsa.generateKey()',
      explanation: 'Broken by Shor',
      replacement: 'ML-KEM',
    },
  ],
  enrichedFindings: [
    {
      file: 'src/auth.ts',
      line: 42,
      algorithm: 'RSA',
      category: 'asymmetric',
      risk: 'CRITICAL',
      snippet: 'rsa.generateKey()',
      explanation: 'Broken by Shor',
      replacement: 'ML-KEM',
      context: {
        sensitivity: 'high',
        hndlRisk: true,
        isTestFile: false,
        migrationEffort: 'high',
      },
    },
  ],
  summary: { critical: 1, warning: 0, info: 0, ok: 0 },
  grade: 'C',
  readiness: {
    overall: 34,
    dimensions: {
      vulnerability: { score: 92, weighted: 36.8, details: '1 critical' },
      priority: { score: 56, weighted: 14, details: '1 HNDL' },
      migration: { score: 0, weighted: 0, details: 'No PQC' },
      agility: { score: 100, weighted: 15, details: '1 file' },
    },
  },
  ...overrides,
});

describe('formatTerminal', () => {
  it('displays readiness score', () => {
    const output = formatTerminal(makeReport());
    expect(output).toContain('PQC Readiness');
    expect(output).toContain('34');
  });

  it('displays dimension scores', () => {
    const output = formatTerminal(makeReport());
    expect(output).toContain('Vulnerability');
    expect(output).toContain('Priority');
    expect(output).toContain('Migration');
    expect(output).toContain('Agility');
  });

  it('shows HNDL warning when key exchange vulns present', () => {
    const output = formatTerminal(makeReport());
    expect(output).toContain('HARVEST');
  });

  it('shows enriched finding context', () => {
    const output = formatTerminal(makeReport());
    expect(output).toContain('HNDL');
    expect(output).toContain('HIGH');
  });

  it('does not show HNDL warning when no key exchange vulns', () => {
    const report = makeReport({
      enrichedFindings: [
        {
          file: 'src/auth.ts',
          line: 42,
          algorithm: 'ECDSA',
          category: 'asymmetric',
          risk: 'CRITICAL',
          snippet: 'ecdsa.sign()',
          explanation: 'Broken',
          replacement: 'ML-DSA',
          context: {
            sensitivity: 'high',
            hndlRisk: false,
            isTestFile: false,
            migrationEffort: 'medium',
          },
        },
      ],
    });
    const output = formatTerminal(report);
    expect(output).not.toContain('HARVEST');
  });
});
