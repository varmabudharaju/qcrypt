import crypto from 'node:crypto';
import { benchmark } from './runner.js';
import type { BenchmarkResult } from '../types.js';

const TEST_DATA = Buffer.alloc(1024, 'a');

export function getHashBenchmarks(iterations: number): BenchmarkResult[] {
  const hashes: Array<{ algorithm: string; nodeName: string }> = [
    { algorithm: 'MD5', nodeName: 'md5' },
    { algorithm: 'SHA-256', nodeName: 'sha256' },
    { algorithm: 'SHA-512', nodeName: 'sha512' },
    { algorithm: 'SHA3-256', nodeName: 'sha3-256' },
  ];

  return hashes.map(({ algorithm, nodeName }) => {
    const timing = benchmark(() => {
      crypto.createHash(nodeName).update(TEST_DATA).digest();
    }, iterations);

    return {
      algorithm,
      operation: 'hash' as const,
      ...timing,
      iterations,
      isReference: false,
      quantumSafe: false,
    };
  });
}
