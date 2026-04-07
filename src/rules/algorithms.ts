import type { AlgorithmRule } from '../types.js';

const rules: AlgorithmRule[] = [
  // CRITICAL — broken by Shor's algorithm
  { id: 'RSA', name: 'RSA', risk: 'CRITICAL', category: 'asymmetric' },
  { id: 'ECDSA', name: 'ECDSA', risk: 'CRITICAL', category: 'asymmetric' },
  { id: 'ECDH', name: 'ECDH', risk: 'CRITICAL', category: 'asymmetric' },
  { id: 'DSA', name: 'DSA', risk: 'CRITICAL', category: 'asymmetric' },
  { id: 'DH', name: 'Diffie-Hellman', risk: 'CRITICAL', category: 'asymmetric' },
  { id: 'EdDSA', name: 'EdDSA', risk: 'CRITICAL', category: 'asymmetric' },
  { id: 'Ed25519', name: 'Ed25519', risk: 'CRITICAL', category: 'asymmetric' },
  { id: 'X25519', name: 'X25519', risk: 'CRITICAL', category: 'asymmetric' },
  { id: 'P-256', name: 'ECC P-256', risk: 'CRITICAL', category: 'asymmetric' },
  { id: 'P-384', name: 'ECC P-384', risk: 'CRITICAL', category: 'asymmetric' },
  { id: 'secp256k1', name: 'secp256k1', risk: 'CRITICAL', category: 'asymmetric' },
  // WARNING — weakened by Grover's or already weak
  { id: 'AES-128', name: 'AES-128', risk: 'WARNING', category: 'symmetric' },
  { id: 'DES', name: 'DES', risk: 'WARNING', category: 'symmetric' },
  { id: '3DES', name: 'Triple DES', risk: 'WARNING', category: 'symmetric' },
  { id: 'RC4', name: 'RC4', risk: 'WARNING', category: 'symmetric' },
  { id: 'MD5', name: 'MD5', risk: 'WARNING', category: 'hash' },
  { id: 'SHA-1', name: 'SHA-1', risk: 'WARNING', category: 'hash' },
  // INFO — reduced security margin
  { id: 'AES-192', name: 'AES-192', risk: 'INFO', category: 'symmetric' },
  // OK — quantum resistant
  { id: 'AES-256', name: 'AES-256', risk: 'OK', category: 'symmetric' },
  { id: 'SHA-256', name: 'SHA-256', risk: 'OK', category: 'hash' },
  { id: 'SHA-384', name: 'SHA-384', risk: 'OK', category: 'hash' },
  { id: 'SHA-512', name: 'SHA-512', risk: 'OK', category: 'hash' },
  { id: 'SHA-3', name: 'SHA-3', risk: 'OK', category: 'hash' },
  { id: 'ML-KEM', name: 'ML-KEM (Kyber)', risk: 'OK', category: 'asymmetric' },
  { id: 'ML-DSA', name: 'ML-DSA (Dilithium)', risk: 'OK', category: 'asymmetric' },
  { id: 'SLH-DSA', name: 'SLH-DSA (SPHINCS+)', risk: 'OK', category: 'asymmetric' },
];

const ruleMap = new Map(rules.map((r) => [r.id, r]));

export function getAlgorithmRule(id: string): AlgorithmRule | undefined {
  // Direct match first, then try base algorithm (e.g., RSA-2048 → RSA)
  return ruleMap.get(id) ?? ruleMap.get(id.replace(/-\d+$/, ''));
}

export function getAllRules(): AlgorithmRule[] {
  return [...rules];
}
