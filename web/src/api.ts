interface BenchmarkResult {
  algorithm: string;
  operation: string;
  opsPerSecond: number;
  avgTimeMs: number;
  iterations: number;
  isReference: boolean;
  quantumSafe: boolean;
}

interface AlgorithmProfile {
  algorithm: string;
  category: string;
  quantumSafe: boolean;
  publicKeySize: number;
  privateKeySize: number;
  signatureSize?: number;
  ciphertextSize?: number;
  securityLevel: string;
}

interface Comparison {
  classical: string;
  postQuantum: string;
  speedup: string;
  sizeTradeoff: string;
  explanation: string;
}

export interface BenchmarkReport {
  id: string;
  runAt: string;
  platform: { os: string; arch: string; node: string; cpuModel: string };
  iterations: number;
  results: BenchmarkResult[];
  profiles: AlgorithmProfile[];
  comparisons: Comparison[];
}

export async function runBench(iterations: number, category: string): Promise<BenchmarkReport> {
  const res = await fetch('/api/bench', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ iterations, category }),
  });
  return res.json();
}

export async function getBenchHistory(): Promise<BenchmarkReport[]> {
  const res = await fetch('/api/bench/history');
  return res.json();
}

export async function getBench(id: string): Promise<BenchmarkReport> {
  const res = await fetch(`/api/bench/${id}`);
  return res.json();
}

export async function getReference(): Promise<{ results: BenchmarkResult[]; profiles: AlgorithmProfile[] }> {
  const res = await fetch('/api/reference');
  return res.json();
}

export async function healthCheck(): Promise<{ status: string }> {
  const res = await fetch('/api/health');
  return res.json();
}
