import { describe, it, expect } from 'vitest';
import { getAlgorithmRule, getAllRules } from '../src/rules/algorithms.js';

describe('algorithm rules', () => {
  it('classifies RSA as CRITICAL', () => {
    const rule = getAlgorithmRule('RSA');
    expect(rule).toBeDefined();
    expect(rule!.risk).toBe('CRITICAL');
    expect(rule!.category).toBe('asymmetric');
  });
  it('classifies ECDSA as CRITICAL', () => {
    const rule = getAlgorithmRule('ECDSA');
    expect(rule).toBeDefined();
    expect(rule!.risk).toBe('CRITICAL');
  });
  it('classifies ECDH as CRITICAL', () => {
    const rule = getAlgorithmRule('ECDH');
    expect(rule).toBeDefined();
    expect(rule!.risk).toBe('CRITICAL');
  });
  it('classifies DSA as CRITICAL', () => {
    const rule = getAlgorithmRule('DSA');
    expect(rule).toBeDefined();
    expect(rule!.risk).toBe('CRITICAL');
  });
  it('classifies DH as CRITICAL', () => {
    const rule = getAlgorithmRule('DH');
    expect(rule).toBeDefined();
    expect(rule!.risk).toBe('CRITICAL');
  });
  it('classifies AES-128 as WARNING', () => {
    const rule = getAlgorithmRule('AES-128');
    expect(rule).toBeDefined();
    expect(rule!.risk).toBe('WARNING');
    expect(rule!.category).toBe('symmetric');
  });
  it('classifies MD5 as WARNING', () => {
    const rule = getAlgorithmRule('MD5');
    expect(rule).toBeDefined();
    expect(rule!.risk).toBe('WARNING');
    expect(rule!.category).toBe('hash');
  });
  it('classifies SHA-1 as WARNING', () => {
    const rule = getAlgorithmRule('SHA-1');
    expect(rule).toBeDefined();
    expect(rule!.risk).toBe('WARNING');
  });
  it('classifies DES as WARNING', () => {
    const rule = getAlgorithmRule('DES');
    expect(rule).toBeDefined();
    expect(rule!.risk).toBe('WARNING');
  });
  it('classifies 3DES as WARNING', () => {
    const rule = getAlgorithmRule('3DES');
    expect(rule).toBeDefined();
    expect(rule!.risk).toBe('WARNING');
  });
  it('classifies AES-192 as INFO', () => {
    const rule = getAlgorithmRule('AES-192');
    expect(rule).toBeDefined();
    expect(rule!.risk).toBe('INFO');
  });
  it('classifies AES-256 as OK', () => {
    const rule = getAlgorithmRule('AES-256');
    expect(rule).toBeDefined();
    expect(rule!.risk).toBe('OK');
    expect(rule!.category).toBe('symmetric');
  });
  it('classifies ML-KEM as OK', () => {
    const rule = getAlgorithmRule('ML-KEM');
    expect(rule).toBeDefined();
    expect(rule!.risk).toBe('OK');
  });
  it('returns undefined for unknown algorithms', () => {
    const rule = getAlgorithmRule('NONEXISTENT');
    expect(rule).toBeUndefined();
  });
  it('getAllRules returns all defined rules', () => {
    const rules = getAllRules();
    expect(rules.length).toBeGreaterThanOrEqual(15);
  });
});
