import { describe, it, expect } from 'vitest';
import { formatCbom } from '../src/reporters/cbom.js';
import type { ScanReport } from '../src/types.js';

const makeReport = (): ScanReport => ({
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
      explanation: 'Broken',
      replacement: 'ML-KEM',
    },
    {
      file: 'src/hash.ts',
      line: 10,
      algorithm: 'SHA-256',
      category: 'hash',
      risk: 'OK',
      snippet: 'sha256(data)',
      explanation: 'Safe',
      replacement: 'No change',
    },
  ],
  enrichedFindings: [],
  summary: { critical: 1, warning: 0, info: 0, ok: 1 },
  grade: 'C',
  readiness: {
    overall: 50,
    dimensions: {
      vulnerability: { score: 60, weighted: 24, details: '' },
      priority: { score: 70, weighted: 17.5, details: '' },
      migration: { score: 0, weighted: 0, details: '' },
      agility: { score: 75, weighted: 11.25, details: '' },
    },
  },
});

describe('formatCbom', () => {
  it('produces valid CycloneDX 1.6 structure', () => {
    const cbom = JSON.parse(formatCbom(makeReport()));
    expect(cbom.bomFormat).toBe('CycloneDX');
    expect(cbom.specVersion).toBe('1.6');
    expect(cbom.components).toHaveLength(2);
  });

  it('includes metadata with tool info', () => {
    const cbom = JSON.parse(formatCbom(makeReport()));
    expect(cbom.metadata.tools.components[0].name).toBe('qcrypt-scan');
  });

  it('maps findings to cryptographic-asset components', () => {
    const cbom = JSON.parse(formatCbom(makeReport()));
    const rsa = cbom.components.find((c: any) => c.name === 'RSA');
    expect(rsa.type).toBe('cryptographic-asset');
    expect(rsa.cryptoProperties.assetType).toBe('algorithm');
  });

  it('maps algorithm categories to primitives', () => {
    const cbom = JSON.parse(formatCbom(makeReport()));
    const rsa = cbom.components.find((c: any) => c.name === 'RSA');
    const sha = cbom.components.find((c: any) => c.name === 'SHA-256');
    expect(rsa.cryptoProperties.algorithmProperties.primitive).toBe('pke');
    expect(sha.cryptoProperties.algorithmProperties.primitive).toBe('hash');
  });

  it('includes risk level in properties', () => {
    const cbom = JSON.parse(formatCbom(makeReport()));
    const rsa = cbom.components.find((c: any) => c.name === 'RSA');
    const riskProp = rsa.properties.find((p: any) => p.name === 'quantumRisk');
    expect(riskProp.value).toBe('CRITICAL');
  });

  it('includes evidence with file locations', () => {
    const cbom = JSON.parse(formatCbom(makeReport()));
    const rsa = cbom.components.find((c: any) => c.name === 'RSA');
    expect(rsa.evidence.occurrences[0].location).toBe('src/auth.ts:42');
  });
});
