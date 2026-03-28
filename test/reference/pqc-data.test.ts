import { describe, it, expect } from 'vitest';
import { getPqcReferenceResults, getPqcProfiles } from '../src/reference/pqc-data.js';
import type { BenchmarkResult, AlgorithmProfile } from '../src/types.js';

describe('PQC reference data', () => {
  describe('getPqcReferenceResults', () => {
    it('returns results for ML-KEM variants', () => {
      const results = getPqcReferenceResults();
      const mlKem = results.filter((r) => r.algorithm.startsWith('ML-KEM'));
      expect(mlKem.length).toBeGreaterThanOrEqual(5);
    });

    it('returns results for ML-DSA variants', () => {
      const results = getPqcReferenceResults();
      const mlDsa = results.filter((r) => r.algorithm.startsWith('ML-DSA'));
      expect(mlDsa.length).toBeGreaterThanOrEqual(5);
    });

    it('returns results for SLH-DSA', () => {
      const results = getPqcReferenceResults();
      const slhDsa = results.filter((r) => r.algorithm.startsWith('SLH-DSA'));
      expect(slhDsa.length).toBeGreaterThanOrEqual(3);
    });

    it('all results are reference and quantum safe', () => {
      const results = getPqcReferenceResults();
      for (const r of results) {
        expect(r.isReference).toBe(true);
        expect(r.quantumSafe).toBe(true);
      }
    });

    it('all results have positive timing values', () => {
      const results = getPqcReferenceResults();
      for (const r of results) {
        expect(r.opsPerSecond).toBeGreaterThan(0);
        expect(r.avgTimeMs).toBeGreaterThan(0);
      }
    });
  });

  describe('getPqcProfiles', () => {
    it('returns profiles for all PQC algorithms', () => {
      const profiles = getPqcProfiles();
      const algorithms = profiles.map((p) => p.algorithm);

      expect(algorithms).toContain('ML-KEM-512');
      expect(algorithms).toContain('ML-KEM-768');
      expect(algorithms).toContain('ML-KEM-1024');
      expect(algorithms).toContain('ML-DSA-44');
      expect(algorithms).toContain('ML-DSA-65');
      expect(algorithms).toContain('ML-DSA-87');
      expect(algorithms).toContain('SLH-DSA-128s');
    });

    it('all profiles are quantum safe', () => {
      const profiles = getPqcProfiles();
      for (const p of profiles) {
        expect(p.quantumSafe).toBe(true);
      }
    });

    it('KEM profiles have ciphertextSize', () => {
      const profiles = getPqcProfiles();
      const kems = profiles.filter((p) => p.algorithm.startsWith('ML-KEM'));
      for (const p of kems) {
        expect(p.ciphertextSize).toBeGreaterThan(0);
      }
    });

    it('DSA profiles have signatureSize', () => {
      const profiles = getPqcProfiles();
      const dsas = profiles.filter((p) =>
        p.algorithm.startsWith('ML-DSA') || p.algorithm.startsWith('SLH-DSA')
      );
      for (const p of dsas) {
        expect(p.signatureSize).toBeGreaterThan(0);
      }
    });
  });
});
