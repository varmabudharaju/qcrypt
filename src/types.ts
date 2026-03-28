export type Operation = 'keygen' | 'sign' | 'verify' | 'encrypt' | 'decrypt' | 'hash' | 'encaps' | 'decaps';

export type BenchmarkCategory = 'all' | 'kex' | 'sigs' | 'sym' | 'hash';

export interface BenchmarkResult {
  algorithm: string;
  operation: Operation;
  opsPerSecond: number;
  avgTimeMs: number;
  iterations: number;
  isReference: boolean;
  quantumSafe: boolean;
}

export interface AlgorithmProfile {
  algorithm: string;
  category: 'asymmetric' | 'symmetric' | 'hash';
  quantumSafe: boolean;
  publicKeySize: number;
  privateKeySize: number;
  signatureSize?: number;
  ciphertextSize?: number;
  securityLevel: string;
}

export interface BenchmarkReport {
  id: string;
  runAt: string;
  platform: {
    os: string;
    arch: string;
    node: string;
    cpuModel: string;
  };
  iterations: number;
  results: BenchmarkResult[];
  profiles: AlgorithmProfile[];
  comparisons: Comparison[];
}

export interface Comparison {
  classical: string;
  postQuantum: string;
  speedup: string;
  sizeTradeoff: string;
  explanation: string;
}
