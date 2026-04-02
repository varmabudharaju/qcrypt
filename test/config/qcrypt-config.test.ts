import { describe, it, expect } from 'vitest';
import { parseQcryptConfig, applyConfigOverrides } from '../../src/config/qcrypt-config.js';
import type { EnrichedFinding } from '../../src/types.js';

describe('parseQcryptConfig', () => {
  it('parses valid YAML config', () => {
    const yaml = `
sensitivity:
  high:
    - "src/payments/**"
  low:
    - "src/legacy/**"
  ignore:
    - "vendor/**"
`;
    const config = parseQcryptConfig(yaml);
    expect(config.sensitivity?.high).toEqual(['src/payments/**']);
    expect(config.sensitivity?.low).toEqual(['src/legacy/**']);
    expect(config.sensitivity?.ignore).toEqual(['vendor/**']);
  });

  it('returns empty config for empty input', () => {
    const config = parseQcryptConfig('');
    expect(config).toEqual({});
  });

  it('returns empty config for invalid YAML', () => {
    const config = parseQcryptConfig(':::invalid');
    expect(config).toEqual({});
  });
});

describe('applyConfigOverrides', () => {
  const makeFinding = (file: string, sensitivity: 'high' | 'medium' | 'low'): EnrichedFinding => ({
    file,
    line: 1,
    algorithm: 'RSA',
    category: 'asymmetric',
    risk: 'CRITICAL',
    snippet: '',
    explanation: '',
    replacement: '',
    context: {
      sensitivity,
      hndlRisk: false,
      isTestFile: false,
      migrationEffort: 'medium',
    },
  });

  it('overrides sensitivity to high for matching paths', () => {
    const findings = [makeFinding('src/payments/charge.ts', 'medium')];
    const config = { sensitivity: { high: ['src/payments/**'] } };
    const result = applyConfigOverrides(findings, config);
    expect(result[0].context.sensitivity).toBe('high');
  });

  it('overrides sensitivity to low for matching paths', () => {
    const findings = [makeFinding('src/legacy/old.ts', 'medium')];
    const config = { sensitivity: { low: ['src/legacy/**'] } };
    const result = applyConfigOverrides(findings, config);
    expect(result[0].context.sensitivity).toBe('low');
  });

  it('filters out ignored paths', () => {
    const findings = [
      makeFinding('src/app.ts', 'medium'),
      makeFinding('vendor/lib.ts', 'medium'),
    ];
    const config = { sensitivity: { ignore: ['vendor/**'] } };
    const result = applyConfigOverrides(findings, config);
    expect(result).toHaveLength(1);
    expect(result[0].file).toBe('src/app.ts');
  });

  it('returns findings unchanged with empty config', () => {
    const findings = [makeFinding('src/app.ts', 'medium')];
    const result = applyConfigOverrides(findings, {});
    expect(result).toEqual(findings);
  });
});
