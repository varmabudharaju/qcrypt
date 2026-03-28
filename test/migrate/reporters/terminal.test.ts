import { describe, it, expect } from 'vitest';
import { formatTerminal } from '../src/migrate/reporters/terminal.js';
import { generateMigrationPlan } from '../src/migrate/index.js';
import { SAMPLE_SCAN_REPORT } from '../fixtures.js';

describe('formatTerminal', () => {
  const plan = generateMigrationPlan(SAMPLE_SCAN_REPORT);
  const output = formatTerminal(plan);

  it('includes the header', () => {
    expect(output).toContain('qcrypt-migrate');
    expect(output).toContain('Migration Guide');
  });

  it('includes summary counts', () => {
    expect(output).toContain('Immediate');
    expect(output).toContain('Short-term');
    expect(output).toContain('Long-term');
  });

  it('includes scan info', () => {
    expect(output).toContain(SAMPLE_SCAN_REPORT.path);
    expect(output).toContain('grade');
  });

  it('includes step actions', () => {
    expect(output).toContain('RSA-2048');
    expect(output).toContain('MD5');
    expect(output).toContain('AES-128-GCM');
  });

  it('includes file references', () => {
    expect(output).toContain('src/auth.ts:15');
    expect(output).toContain('src/utils/hash.py:8');
  });

  it('includes phase sections', () => {
    expect(output).toContain('Immediate (Critical)');
    expect(output).toContain('Short-term (Warning)');
    expect(output).toContain('Long-term (Info)');
  });
});
