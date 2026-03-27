import { describe, it, expect } from 'vitest';
import { getExplanation } from '../src/education/explanations.js';

describe('educational explanations', () => {
  it('provides explanation for RSA', () => {
    const exp = getExplanation('RSA');
    expect(exp.explanation).toContain("Shor's");
    expect(exp.replacement).toContain('ML-KEM');
  });
  it('provides explanation for ECDSA', () => {
    const exp = getExplanation('ECDSA');
    expect(exp.explanation).toContain("Shor's");
    expect(exp.replacement).toContain('ML-DSA');
  });
  it('provides explanation for MD5', () => {
    const exp = getExplanation('MD5');
    expect(exp.explanation.length).toBeGreaterThan(0);
    expect(exp.replacement).toContain('SHA-3');
  });
  it('provides explanation for AES-128', () => {
    const exp = getExplanation('AES-128');
    expect(exp.explanation).toContain("Grover's");
    expect(exp.replacement).toContain('AES-256');
  });
  it('provides explanation for AES-256', () => {
    const exp = getExplanation('AES-256');
    expect(exp.explanation).toContain('quantum-resistant');
  });
  it('provides fallback for unknown algorithms', () => {
    const exp = getExplanation('UNKNOWN_ALGO');
    expect(exp.explanation.length).toBeGreaterThan(0);
    expect(exp.replacement.length).toBeGreaterThan(0);
  });
});
