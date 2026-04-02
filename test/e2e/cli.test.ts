import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';

describe('E2E: CLI', () => {
  const run = (args: string) => {
    try {
      return execSync(`npx tsx src/cli.ts ${args}`, {
        cwd: process.cwd(),
        encoding: 'utf-8',
        timeout: 15000,
        maxBuffer: 10 * 1024 * 1024,
      });
    } catch (err: any) {
      return err.stdout ?? '';
    }
  };

  it('outputs terminal format by default', () => {
    const output = run('test/fixtures/vulnerable');
    expect(output).toContain('qcrypt-scan');
    expect(output).toContain('RSA');
    expect(output).toContain('CRITICAL');
  });

  it('outputs JSON with --json flag', () => {
    const output = run('test/fixtures/vulnerable --json');
    const parsed = JSON.parse(output);
    expect(parsed).toHaveProperty('grade');
    expect(parsed).toHaveProperty('findings');
    expect(parsed).toHaveProperty('summary');
  });

  it('reports grade A for safe fixtures', () => {
    const output = run('test/fixtures/safe --json');
    const parsed = JSON.parse(output);
    // Safe fixtures score B (80/100) under readiness-based grading because
    // the migration dimension scores 0 (no PQC adoption detected yet).
    expect(parsed.grade).toBe('B');
    expect(parsed.summary.critical).toBe(0);
  });

  it('includes explanations in terminal output', () => {
    const output = run('test/fixtures/vulnerable');
    expect(output).toContain("Shor's");
  });
});
