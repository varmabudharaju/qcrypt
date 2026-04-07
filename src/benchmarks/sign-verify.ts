import crypto from 'node:crypto';
import { benchmark } from './runner.js';
import type { BenchmarkResult } from '../types.js';

const TEST_DATA = Buffer.from('The quick brown fox jumps over the lazy dog');

function signVerifySuite(
  algorithm: string,
  keygenFn: () => { publicKey: crypto.KeyObject; privateKey: crypto.KeyObject },
  signFn: (privateKey: crypto.KeyObject) => Buffer,
  verifyFn: (publicKey: crypto.KeyObject, signature: Buffer) => boolean,
  iterations: number,
): BenchmarkResult[] {
  const results: BenchmarkResult[] = [];

  // Generate a key pair for sign/verify (keygen benchmarked separately in keygen.ts)
  const { publicKey, privateKey } = keygenFn();

  const signTiming = benchmark(() => { signFn(privateKey); }, iterations);
  results.push({
    algorithm, operation: 'sign', ...signTiming,
    iterations, isReference: false, quantumSafe: false,
  });

  const signature = signFn(privateKey);

  const verifyTiming = benchmark(() => { verifyFn(publicKey, signature); }, iterations);
  results.push({
    algorithm, operation: 'verify', ...verifyTiming,
    iterations, isReference: false, quantumSafe: false,
  });

  return results;
}

export function getSignVerifyBenchmarks(iterations: number): BenchmarkResult[] {
  const results: BenchmarkResult[] = [];

  // RSA-2048
  results.push(...signVerifySuite(
    'RSA-2048',
    () => crypto.generateKeyPairSync('rsa', { modulusLength: 2048 }),
    (privateKey) => crypto.sign('sha256', TEST_DATA, privateKey),
    (publicKey, sig) => crypto.verify('sha256', TEST_DATA, publicKey, sig),
    iterations,
  ));

  // ECDSA-P256
  results.push(...signVerifySuite(
    'ECDSA-P256',
    () => crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' }),
    (privateKey) => crypto.sign('sha256', TEST_DATA, { key: privateKey, dsaEncoding: 'ieee-p1363' }),
    (publicKey, sig) => crypto.verify('sha256', TEST_DATA, { key: publicKey, dsaEncoding: 'ieee-p1363' }, sig),
    iterations,
  ));

  // Ed25519
  results.push(...signVerifySuite(
    'Ed25519',
    () => crypto.generateKeyPairSync('ed25519'),
    (privateKey) => crypto.sign(null, TEST_DATA, privateKey),
    (publicKey, sig) => crypto.verify(null, TEST_DATA, publicKey, sig),
    iterations,
  ));

  return results;
}
