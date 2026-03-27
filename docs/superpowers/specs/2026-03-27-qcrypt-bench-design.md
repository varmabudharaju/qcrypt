# qcrypt-bench — Design Spec

**Date:** 2026-03-27
**Status:** Approved
**Series:** qcrypt (2 of 3: scan → bench → migrate)

## Problem

Developers hear "migrate to post-quantum crypto" but have no intuition for the tradeoffs — how much slower is ML-KEM vs RSA? How much bigger are the keys? Without concrete numbers on their own hardware, migration feels abstract and scary.

## Solution

An interactive CLI + web tool that benchmarks classical crypto on your machine and compares results side-by-side with NIST reference data for post-quantum replacements. Every comparison includes educational context explaining the tradeoffs.

## Architecture

### Project Structure

```
qcrypt-bench/
├── src/
│   ├── benchmarks/
│   │   ├── keygen.ts          # Key generation benchmarks
│   │   ├── sign-verify.ts     # Signing and verification benchmarks
│   │   ├── encrypt-decrypt.ts # Encryption and decryption benchmarks
│   │   ├── hash.ts            # Hashing benchmarks
│   │   └── runner.ts          # Benchmark runner (timing, iterations)
│   ├── reference/
│   │   └── pqc-data.ts        # NIST reference data for PQC algorithms
│   ├── education/
│   │   └── comparisons.ts     # Educational comparisons and explanations
│   ├── reporters/
│   │   ├── terminal.ts        # CLI table output
│   │   └── json.ts            # JSON output
│   ├── api/
│   │   └── server.ts          # Fastify API server
│   ├── cli.ts                 # CLI entry point
│   ├── index.ts               # Core orchestrator
│   └── types.ts               # Core types
├── web/                       # React UI (same pattern as qcrypt-scan)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Comparison.tsx
│   │   │   └── Education.tsx
│   │   ├── App.tsx
│   │   ├── api.ts
│   │   └── theme.tsx
│   └── ...
├── test/
│   ├── benchmarks/
│   └── e2e/
├── package.json
└── tsconfig.json
```

## Core Types

```typescript
interface BenchmarkResult {
  algorithm: string;
  operation: 'keygen' | 'sign' | 'verify' | 'encrypt' | 'decrypt' | 'hash' | 'encaps' | 'decaps';
  opsPerSecond: number;
  avgTimeMs: number;
  iterations: number;
  isReference: boolean;        // true = NIST reference data, not run locally
  quantumSafe: boolean;
}

interface AlgorithmProfile {
  algorithm: string;
  category: 'asymmetric' | 'symmetric' | 'hash';
  quantumSafe: boolean;
  publicKeySize: number;       // bytes
  privateKeySize: number;      // bytes
  signatureSize?: number;      // bytes (for signature algorithms)
  ciphertextSize?: number;     // bytes (for KEM algorithms)
  securityLevel: string;       // e.g., "128-bit classical, 0-bit quantum"
}

interface BenchmarkReport {
  id: string;
  runAt: string;
  platform: { os: string; arch: string; node: string; cpuModel: string };
  iterations: number;
  results: BenchmarkResult[];
  profiles: AlgorithmProfile[];
  comparisons: Comparison[];
}

interface Comparison {
  classical: string;           // e.g., "RSA-2048"
  postQuantum: string;         // e.g., "ML-KEM-768"
  speedup: string;             // e.g., "ML-KEM is 1125x faster at key generation"
  sizeTradeoff: string;        // e.g., "but public keys are 4x larger (1184B vs 294B)"
  explanation: string;         // educational context
}
```

## Classical Benchmarks (run locally via Node crypto)

| Category | Algorithms | Operations |
|----------|-----------|------------|
| Key Exchange | RSA-2048, RSA-4096, ECDH-P256, X25519 | keygen |
| Signatures | RSA-2048, ECDSA-P256, Ed25519 | keygen, sign, verify |
| Symmetric | AES-128-GCM, AES-256-GCM | encrypt, decrypt |
| Hashing | MD5, SHA-256, SHA-512, SHA3-256 | hash |

### Benchmark Runner

```typescript
function benchmark(fn: () => void, iterations: number): { opsPerSecond: number; avgTimeMs: number } {
  // Warm up
  for (let i = 0; i < 10; i++) fn();

  // Timed run
  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  const elapsed = performance.now() - start;

  return {
    opsPerSecond: Math.round((iterations / elapsed) * 1000),
    avgTimeMs: Number((elapsed / iterations).toFixed(4)),
  };
}
```

Default iterations: 1000 (configurable via --iterations flag).

## PQC Reference Data

Hardcoded from NIST PQC benchmarks (Skylake reference implementation):

| Algorithm | Operation | Time | Key Size | Sig/CT Size |
|-----------|-----------|------|----------|-------------|
| ML-KEM-512 | keygen | 0.03ms | pk: 800B, sk: 1632B | ct: 768B |
| ML-KEM-768 | keygen | 0.05ms | pk: 1184B, sk: 2400B | ct: 1088B |
| ML-KEM-1024 | keygen | 0.07ms | pk: 1568B, sk: 3168B | ct: 1568B |
| ML-KEM-768 | encaps | 0.06ms | — | — |
| ML-KEM-768 | decaps | 0.07ms | — | — |
| ML-DSA-44 | keygen | 0.08ms | pk: 1312B, sk: 2528B | sig: 2420B |
| ML-DSA-65 | keygen | 0.13ms | pk: 1952B, sk: 4000B | sig: 3293B |
| ML-DSA-87 | keygen | 0.18ms | pk: 2592B, sk: 4864B | sig: 4595B |
| ML-DSA-65 | sign | 0.30ms | — | — |
| ML-DSA-65 | verify | 0.14ms | — | — |
| SLH-DSA-128s | keygen | 2.5ms | pk: 32B, sk: 64B | sig: 7856B |
| SLH-DSA-128s | sign | 45ms | — | — |
| SLH-DSA-128s | verify | 2.8ms | — | — |

Source: NIST PQC standardization, Round 3 reference implementations.

## Educational Comparisons

Pre-built comparisons that pair classical → PQC:

- **RSA-2048 → ML-KEM-768:** Key exchange replacement. ML-KEM is ~1000x faster at keygen, but public keys are 4x larger.
- **ECDSA-P256 → ML-DSA-65:** Signature replacement. ML-DSA signs ~2x slower but verifies ~2x faster. Signatures are 50x larger (3293B vs 64B).
- **ECDH-P256 → ML-KEM-768:** Key agreement replacement. ML-KEM encapsulation is comparable speed. Shared secret derivation changes.
- **Ed25519 → ML-DSA-44:** Fast signature replacement. ML-DSA is slower to sign but keys/sigs are much larger.
- **RSA-2048 → SLH-DSA-128s:** Conservative replacement. SLH-DSA is slow but relies only on hash security — minimal assumptions.

Each comparison includes a plain-English explanation of what developers gain and give up.

## CLI

```bash
npx qcrypt-bench                    # run all benchmarks, terminal output
npx qcrypt-bench --json             # JSON output
npx qcrypt-bench --iterations 5000  # more iterations for precision
npx qcrypt-bench --category sigs    # only signature algorithms
npx qcrypt-bench --serve            # start web UI on port 3200
```

### Categories
- `all` (default) — everything
- `kex` — key exchange/encapsulation only
- `sigs` — signatures only
- `sym` — symmetric encryption only
- `hash` — hashing only

## API

```
POST /api/bench              # run benchmarks, return BenchmarkReport
  Body: { iterations?: number, category?: string }

GET  /api/bench/history      # list past runs
GET  /api/bench/:id          # get specific run
GET  /api/reference          # PQC reference data only
GET  /api/health             # health check
```

## Web UI

Same framework as qcrypt-scan: React + Vite 5 + Tailwind 3, dark/light themes.

### Pages

1. **Dashboard** — "Run Benchmark" button, iteration slider, category selector. Shows results as a comparison table after running.
2. **Comparison** — Side-by-side view: classical algorithm on left, PQC replacement on right. Bar charts for speed, size comparison circles for key/signature sizes. Educational text below each pair.
3. **Education** — What each algorithm does, why the tradeoffs exist, links to NIST standards.

### Shared with qcrypt-scan
- Theme system (dark/light toggle, same colors)
- Sidebar layout
- Component patterns (cards, badges, tables)

## Testing Strategy

### Unit Tests
- Benchmark runner: verify timing logic, iteration handling
- Reference data: verify all algorithms have complete profiles
- Comparisons: verify educational text exists for all pairs
- Reporters: verify terminal and JSON output format

### E2E Tests
- Full benchmark run against all categories
- CLI output format (terminal + JSON)
- API endpoints

## Tech Stack

- TypeScript + Node.js 20+
- Node `crypto` module (for classical benchmarks)
- Fastify (API)
- Vitest (testing)
- commander (CLI)
- chalk (terminal output)
- React + Vite 5 + Tailwind 3 (web UI)

## Out of Scope (v1)

- Actually running PQC algorithms (reference data only)
- Cross-machine comparison leaderboard
- Continuous benchmarking / regression tracking
- Custom algorithm parameters
