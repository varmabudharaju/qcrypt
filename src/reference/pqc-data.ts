import type { BenchmarkResult, AlgorithmProfile } from '../types.js';

interface ReferenceEntry {
  algorithm: string;
  operation: BenchmarkResult['operation'];
  avgTimeMs: number;
}

// NIST PQC standardization, Round 3 reference implementations (Skylake)
const REFERENCE_ENTRIES: ReferenceEntry[] = [
  // ML-KEM (FIPS 203) — Lattice-based Key Encapsulation
  { algorithm: 'ML-KEM-512', operation: 'keygen', avgTimeMs: 0.03 },
  { algorithm: 'ML-KEM-768', operation: 'keygen', avgTimeMs: 0.05 },
  { algorithm: 'ML-KEM-1024', operation: 'keygen', avgTimeMs: 0.07 },
  { algorithm: 'ML-KEM-768', operation: 'encaps', avgTimeMs: 0.06 },
  { algorithm: 'ML-KEM-768', operation: 'decaps', avgTimeMs: 0.07 },

  // ML-DSA (FIPS 204) — Lattice-based Digital Signatures
  { algorithm: 'ML-DSA-44', operation: 'keygen', avgTimeMs: 0.08 },
  { algorithm: 'ML-DSA-65', operation: 'keygen', avgTimeMs: 0.13 },
  { algorithm: 'ML-DSA-87', operation: 'keygen', avgTimeMs: 0.18 },
  { algorithm: 'ML-DSA-65', operation: 'sign', avgTimeMs: 0.30 },
  { algorithm: 'ML-DSA-65', operation: 'verify', avgTimeMs: 0.14 },

  // SLH-DSA (FIPS 205) — Hash-based Digital Signatures
  { algorithm: 'SLH-DSA-128s', operation: 'keygen', avgTimeMs: 2.5 },
  { algorithm: 'SLH-DSA-128s', operation: 'sign', avgTimeMs: 45 },
  { algorithm: 'SLH-DSA-128s', operation: 'verify', avgTimeMs: 2.8 },
];

export function getPqcReferenceResults(): BenchmarkResult[] {
  return REFERENCE_ENTRIES.map((entry) => ({
    algorithm: entry.algorithm,
    operation: entry.operation,
    avgTimeMs: entry.avgTimeMs,
    opsPerSecond: Math.round(1000 / entry.avgTimeMs),
    iterations: 0,
    isReference: true,
    quantumSafe: true,
  }));
}

const PQC_PROFILES: AlgorithmProfile[] = [
  {
    algorithm: 'ML-KEM-512',
    category: 'asymmetric',
    quantumSafe: true,
    publicKeySize: 800,
    privateKeySize: 1632,
    ciphertextSize: 768,
    securityLevel: '128-bit classical, 128-bit quantum (NIST Level 1)',
  },
  {
    algorithm: 'ML-KEM-768',
    category: 'asymmetric',
    quantumSafe: true,
    publicKeySize: 1184,
    privateKeySize: 2400,
    ciphertextSize: 1088,
    securityLevel: '192-bit classical, 192-bit quantum (NIST Level 3)',
  },
  {
    algorithm: 'ML-KEM-1024',
    category: 'asymmetric',
    quantumSafe: true,
    publicKeySize: 1568,
    privateKeySize: 3168,
    ciphertextSize: 1568,
    securityLevel: '256-bit classical, 256-bit quantum (NIST Level 5)',
  },
  {
    algorithm: 'ML-DSA-44',
    category: 'asymmetric',
    quantumSafe: true,
    publicKeySize: 1312,
    privateKeySize: 2528,
    signatureSize: 2420,
    securityLevel: '128-bit classical, 128-bit quantum (NIST Level 2)',
  },
  {
    algorithm: 'ML-DSA-65',
    category: 'asymmetric',
    quantumSafe: true,
    publicKeySize: 1952,
    privateKeySize: 4000,
    signatureSize: 3293,
    securityLevel: '192-bit classical, 192-bit quantum (NIST Level 3)',
  },
  {
    algorithm: 'ML-DSA-87',
    category: 'asymmetric',
    quantumSafe: true,
    publicKeySize: 2592,
    privateKeySize: 4864,
    signatureSize: 4595,
    securityLevel: '256-bit classical, 256-bit quantum (NIST Level 5)',
  },
  {
    algorithm: 'SLH-DSA-128s',
    category: 'asymmetric',
    quantumSafe: true,
    publicKeySize: 32,
    privateKeySize: 64,
    signatureSize: 7856,
    securityLevel: '128-bit classical, 128-bit quantum (NIST Level 1)',
  },
];

export function getPqcProfiles(): AlgorithmProfile[] {
  return PQC_PROFILES;
}
