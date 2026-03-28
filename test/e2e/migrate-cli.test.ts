import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const PROJECT_ROOT = resolve(new URL(import.meta.url).pathname, '../../..');
const CLI = `npx tsx ${PROJECT_ROOT}/src/migrate/cli.ts`;
const FIXTURE = 'test/migrate/fixtures/sample-scan.json';
const FIXTURE_ABS = resolve(PROJECT_ROOT, FIXTURE);

describe('E2E: qcrypt-migrate CLI', () => {
  it('produces terminal output from --scan-file', () => {
    const output = execSync(`${CLI} --scan-file ${FIXTURE}`, {
      encoding: 'utf-8',
      timeout: 15000,
    });
    expect(output).toContain('qcrypt-migrate');
    expect(output).toContain('Migration Guide');
    expect(output).toContain('RSA-2048');
  });

  it('produces valid JSON with --scan-file --json', () => {
    const output = execSync(`${CLI} --scan-file ${FIXTURE} --json`, {
      encoding: 'utf-8',
      timeout: 15000,
    });
    const parsed = JSON.parse(output);
    expect(parsed.id).toBeTruthy();
    expect(parsed.steps.length).toBeGreaterThan(0);
    expect(parsed.summary.immediate).toBeGreaterThanOrEqual(0);
  });

  it('writes markdown file with --scan-file --markdown', () => {
    const tmpDir = execSync('mktemp -d', { encoding: 'utf-8' }).trim();
    execSync(`${CLI} --scan-file ${FIXTURE_ABS} --markdown`, {
      encoding: 'utf-8',
      timeout: 15000,
      cwd: tmpDir,
    });
    const content = execSync(`cat ${tmpDir}/migration-plan.md`, { encoding: 'utf-8' });
    expect(content).toContain('# Migration Plan');
    expect(content).toContain('RSA-2048');
    execSync(`rm -rf ${tmpDir}`);
  });

  it('exits with error when no path or --scan-file given', () => {
    expect(() => {
      execSync(`${CLI}`, { encoding: 'utf-8', timeout: 15000 });
    }).toThrow();
  });
});
