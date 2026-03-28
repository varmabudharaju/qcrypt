import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';

const CLI = 'npx tsx src/cli.ts';

describe('E2E: CLI', () => {
  it('runs with default options and produces terminal output', () => {
    const output = execSync(`${CLI} --iterations 5`, {
      encoding: 'utf-8',
      timeout: 30000,
    });
    expect(output).toContain('qcrypt-bench');
    expect(output).toContain('RSA-2048');
  });

  it('runs with --json flag and produces valid JSON', () => {
    const output = execSync(`${CLI} --iterations 5 --json`, {
      encoding: 'utf-8',
      timeout: 30000,
    });
    const parsed = JSON.parse(output);
    expect(parsed.id).toBeTruthy();
    expect(parsed.results.length).toBeGreaterThan(0);
  });

  it('filters by category', () => {
    const output = execSync(`${CLI} --iterations 5 --category hash --json`, {
      encoding: 'utf-8',
      timeout: 30000,
    });
    const parsed = JSON.parse(output);
    const operations = parsed.results.map((r: { operation: string }) => r.operation);
    expect(operations).toContain('hash');
    expect(operations).not.toContain('keygen');
  });

  it('respects --iterations flag', () => {
    const output = execSync(`${CLI} --iterations 3 --category hash --json`, {
      encoding: 'utf-8',
      timeout: 30000,
    });
    const parsed = JSON.parse(output);
    expect(parsed.iterations).toBe(3);
  });
});
