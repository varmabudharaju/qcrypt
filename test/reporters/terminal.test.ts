import { describe, it, expect } from 'vitest';
import { formatTerminal } from '../src/reporters/terminal.js';
import type { BenchmarkReport } from '../src/types.js';

describe('terminal reporter', () => {
  const report: BenchmarkReport = {
    id: 'test-123',
    runAt: '2026-03-27T00:00:00Z',
    platform: { os: 'darwin', arch: 'arm64', node: '20.0.0', cpuModel: 'Apple M1' },
    iterations: 1000,
    results: [
      {
        algorithm: 'RSA-2048', operation: 'keygen',
        opsPerSecond: 500, avgTimeMs: 2.0,
        iterations: 1000, isReference: false, quantumSafe: false,
      },
      {
        algorithm: 'ML-KEM-768', operation: 'keygen',
        opsPerSecond: 20000, avgTimeMs: 0.05,
        iterations: 0, isReference: true, quantumSafe: true,
      },
    ],
    profiles: [],
    comparisons: [
      {
        classical: 'RSA-2048', postQuantum: 'ML-KEM-768',
        speedup: 'ML-KEM is 40x faster', sizeTradeoff: 'keys 4x larger',
        explanation: 'RSA relies on factoring...',
      },
    ],
  };

  it('includes header', () => {
    const output = formatTerminal(report);
    expect(output).toContain('qcrypt-bench');
  });

  it('includes platform info', () => {
    const output = formatTerminal(report);
    expect(output).toContain('darwin');
    expect(output).toContain('arm64');
  });

  it('includes benchmark results', () => {
    const output = formatTerminal(report);
    expect(output).toContain('RSA-2048');
    expect(output).toContain('keygen');
    expect(output).toContain('500');
  });

  it('marks reference data', () => {
    const output = formatTerminal(report);
    expect(output).toContain('ML-KEM-768');
    expect(output).toMatch(/ref|reference|NIST/i);
  });

  it('includes comparisons section', () => {
    const output = formatTerminal(report);
    expect(output).toContain('ML-KEM is 40x faster');
    expect(output).toContain('RSA relies on factoring');
  });
});
