import { describe, it, expect } from 'vitest';
import { formatJson } from '../../src/reporters/json.js';
import type { ScanReport } from '../../src/types.js';

describe('JSON reporter', () => {
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
        explanation: 'RSA is broken by quantum computers.',
        replacement: 'Use ML-KEM.',
      },
    ],
    summary: { critical: 1, warning: 0, info: 0, ok: 0 },
    grade: 'C',
  };

  it('returns valid JSON string', () => {
    const output = formatJson(report);
    const parsed = JSON.parse(output);
    expect(parsed.path).toBe('/test/project');
    expect(parsed.grade).toBe('C');
    expect(parsed.findings).toHaveLength(1);
  });

  it('includes all report fields', () => {
    const output = formatJson(report);
    const parsed = JSON.parse(output);
    expect(parsed).toHaveProperty('scannedAt');
    expect(parsed).toHaveProperty('filesScanned');
    expect(parsed).toHaveProperty('summary');
  });
});
