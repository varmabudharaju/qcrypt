import { describe, it, expect } from 'vitest';
import { formatTerminal } from '../../src/reporters/terminal.js';
import type { ScanReport } from '../../src/types.js';

describe('terminal reporter', () => {
  const report: ScanReport = {
    path: '/test/project',
    scannedAt: '2026-03-27T00:00:00.000Z',
    filesScanned: 5,
    findings: [
      {
        file: 'auth.py',
        line: 10,
        algorithm: 'RSA',
        category: 'asymmetric',
        risk: 'CRITICAL',
        snippet: 'rsa.generate_private_key(...)',
        explanation: 'RSA is broken.',
        replacement: 'Use ML-KEM.',
      },
      {
        file: 'utils.py',
        line: 5,
        algorithm: 'MD5',
        category: 'hash',
        risk: 'WARNING',
        snippet: 'hashlib.md5(data)',
        explanation: 'MD5 is weak.',
        replacement: 'Use SHA-3.',
      },
    ],
    summary: { critical: 1, warning: 1, info: 0, ok: 0 },
    grade: 'C',
  };

  it('includes the grade', () => {
    const output = formatTerminal(report);
    expect(output).toContain('C');
  });

  it('includes file paths and line numbers', () => {
    const output = formatTerminal(report);
    expect(output).toContain('auth.py');
    expect(output).toContain('10');
  });

  it('includes algorithm names', () => {
    const output = formatTerminal(report);
    expect(output).toContain('RSA');
    expect(output).toContain('MD5');
  });

  it('includes summary counts', () => {
    const output = formatTerminal(report);
    expect(output).toContain('1');
  });

  it('includes explanations', () => {
    const output = formatTerminal(report);
    expect(output).toContain('RSA is broken');
  });

  it('includes replacements', () => {
    const output = formatTerminal(report);
    expect(output).toContain('ML-KEM');
  });

  it('handles empty findings', () => {
    const emptyReport: ScanReport = {
      ...report,
      findings: [],
      summary: { critical: 0, warning: 0, info: 0, ok: 0 },
      grade: 'A',
    };
    const output = formatTerminal(emptyReport);
    expect(output).toContain('A');
    expect(output).toContain('quantum-safe');
  });
});
