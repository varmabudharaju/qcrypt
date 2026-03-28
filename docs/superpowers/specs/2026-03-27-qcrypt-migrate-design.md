# qcrypt-migrate — Design Spec

**Date:** 2026-03-27
**Status:** Approved
**Series:** qcrypt (3 of 3: scan → bench → migrate)

## Problem

Developers who run qcrypt-scan get a list of quantum-vulnerable crypto findings, but no actionable path forward. They know *what's wrong* but not *how to fix it* — which libraries to use, what code changes to make, what order to tackle things in, or what the rollback plan is.

## Solution

A migration guide generator that consumes scan results (or runs scan internally) and produces a prioritized, phased migration plan with language-aware code examples, dependency recommendations, and rollback guidance. Outputs as terminal, markdown, or JSON. Integrates into the existing qcrypt-bench web UI.

## Architecture

### Data Flow

1. Accept scan JSON (file/stdin) OR run qcrypt-scan internally on a path
2. Parse findings, group by file, prioritize by risk level
3. For each finding, generate a migration step with code example, dependencies, effort estimate
4. Assemble into a `MigrationPlan` with phases (immediate → short-term → long-term)
5. Output as terminal, markdown, or JSON — or serve via API for the web UI

### Project Structure (additions to existing repo)

```
src/migrate/
├── index.ts              # Orchestrator — scan (or accept) → generate plan
├── types.ts              # MigrationStep, MigrationPlan types
├── steps/
│   ├── generator.ts      # Generates MigrationStep from Finding
│   ├── code-examples.ts  # Language-aware before/after snippets
│   └── dependencies.ts   # Package recommendations per language
├── reporters/
│   ├── terminal.ts       # CLI output
│   ├── markdown.ts       # .md file output
│   └── json.ts           # JSON output
└── cli.ts                # Commander entry point

test/migrate/
├── steps/
│   ├── generator.test.ts
│   ├── code-examples.test.ts
│   └── dependencies.test.ts
├── reporters/
│   ├── terminal.test.ts
│   ├── markdown.test.ts
│   └── json.test.ts
├── index.test.ts
└── e2e/
    ├── api.test.ts
    └── cli.test.ts

web/src/pages/Migrate.tsx   # New page in existing web UI
```

## Core Types

```typescript
interface MigrationStep {
  finding: Finding;           // from qcrypt-scan
  priority: 'immediate' | 'short-term' | 'long-term';
  action: string;             // e.g., "Replace RSA key generation with ML-KEM"
  codeExample: string;        // before/after code snippet
  dependencies: string[];     // packages to install
  effort: 'low' | 'medium' | 'high';
  notes: string;              // rollback guidance, gotchas
}

interface MigrationPlan {
  id: string;
  generatedAt: string;
  scanReport: ScanReport;
  steps: MigrationStep[];
  summary: { immediate: number; shortTerm: number; longTerm: number };
  estimatedEffort: string;    // e.g., "12 changes across 8 files"
}
```

`Finding` and `ScanReport` are the types from qcrypt-scan:

```typescript
interface Finding {
  file: string;
  line: number;
  algorithm: string;
  category: 'asymmetric' | 'symmetric' | 'hash' | 'protocol';
  risk: 'CRITICAL' | 'WARNING' | 'INFO' | 'OK';
  snippet: string;
  explanation: string;
  replacement: string;
}

interface ScanReport {
  id: string;
  path: string;
  scannedAt: string;
  filesScanned: number;
  findings: Finding[];
  summary: { critical: number; warning: number; info: number; ok: number };
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}
```

## Priority Mapping

| Risk Level | Priority | Rationale |
|-----------|----------|-----------|
| CRITICAL | immediate | Shor's algorithm targets: RSA, ECDSA, ECDH, DSA, DH, EdDSA, Ed25519, X25519, P-256, P-384 |
| WARNING | short-term | Grover's algorithm targets: AES-128, DES, 3DES, RC4, MD5, SHA-1 |
| INFO | long-term | Marginal security: AES-192 |
| OK | (skip) | Already quantum-safe, no migration needed |

## Effort Estimation

| Change Type | Effort |
|------------|--------|
| Hash algorithm swap (e.g., MD5 → SHA3-256) | low |
| Symmetric key size upgrade (e.g., AES-128 → AES-256) | low |
| Asymmetric algorithm replacement (e.g., RSA → ML-KEM) | high |
| Protocol upgrade (e.g., TLS 1.0 → TLS 1.3) | medium |
| Dependency-level finding (e.g., crypto-js uses DES) | medium |

## Code Examples — Language-Aware

### JavaScript/TypeScript

| Algorithm | Before | After | Package |
|-----------|--------|-------|---------|
| RSA keygen | `crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })` | `import { ml_kem768 } from '@noble/post-quantum/ml-kem'; const { publicKey, secretKey } = ml_kem768.keygen();` | `@noble/post-quantum` |
| ECDSA sign | `crypto.sign('sha256', data, ecPrivateKey)` | `import { ml_dsa65 } from '@noble/post-quantum/ml-dsa'; const sig = ml_dsa65.sign(secretKey, data);` | `@noble/post-quantum` |
| MD5 hash | `crypto.createHash('md5').update(data).digest()` | `crypto.createHash('sha3-256').update(data).digest()` | (built-in) |
| AES-128-GCM | `crypto.createCipheriv('aes-128-gcm', key16, iv)` | `crypto.createCipheriv('aes-256-gcm', key32, iv)` | (built-in) |
| ECDH | `crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' })` | ML-KEM key encapsulation — see RSA keygen pattern | `@noble/post-quantum` |

### Python

| Algorithm | Before | After | Package |
|-----------|--------|-------|---------|
| RSA keygen | `rsa.generate_private_key(public_exponent=65537, key_size=2048)` | `from oqs import KeyEncapsulation; kem = KeyEncapsulation('ML-KEM-768'); pk, sk = kem.generate_keypair()` | `oqs` (liboqs) |
| ECDSA sign | `ec.generate_private_key(SECP256R1())` | `from oqs import Signature; sig = Signature('ML-DSA-65'); pk, sk = sig.generate_keypair()` | `oqs` (liboqs) |
| MD5 hash | `hashlib.md5(data)` | `hashlib.sha3_256(data)` | (built-in) |
| AES-128 | `AES.new(key, AES.MODE_GCM)` (16-byte key) | `AES.new(key, AES.MODE_GCM)` (32-byte key) | (same package) |

### Go

| Algorithm | Before | After | Package |
|-----------|--------|-------|---------|
| RSA | `rsa.GenerateKey(rand.Reader, 2048)` | `import "github.com/cloudflare/circl/kem/mlkem/mlkem768"` | `circl` |
| ECDSA | `ecdsa.GenerateKey(elliptic.P256(), rand.Reader)` | `import "github.com/cloudflare/circl/sign/mldsa/mldsa65"` | `circl` |
| MD5 | `md5.Sum(data)` | `sha3.Sum256(data)` | `golang.org/x/crypto/sha3` |

### Rust

| Algorithm | Before | After | Package |
|-----------|--------|-------|---------|
| RSA | `rsa::RsaPrivateKey::new(&mut rng, 2048)` | `use pqcrypto_mlkem::mlkem768::*; let (pk, sk) = keypair();` | `pqcrypto` |
| ECDSA | `ecdsa::SigningKey::random(&mut rng)` | `use pqcrypto_mldsa::mldsa65::*; let (pk, sk) = keypair();` | `pqcrypto` |

### Java/Kotlin

| Algorithm | Before | After | Package |
|-----------|--------|-------|---------|
| RSA | `KeyPairGenerator.getInstance("RSA")` | `KeyPairGenerator.getInstance("ML-KEM", "BCPQC")` | `bcpqc` (Bouncy Castle) |
| ECDSA | `KeyPairGenerator.getInstance("EC")` | `KeyPairGenerator.getInstance("ML-DSA", "BCPQC")` | `bcpqc` (Bouncy Castle) |
| MD5 | `MessageDigest.getInstance("MD5")` | `MessageDigest.getInstance("SHA3-256")` | (built-in) |

### Immature PQC Support

For languages/contexts where PQC libraries are immature, migration steps say:
- "No production-ready drop-in replacement available yet"
- Recommend hybrid approaches (e.g., ML-KEM + X25519 during transition)
- Link to NIST FIPS 203/204/205 standards
- Suggest monitoring adoption timelines

## Dependency Recommendations

| Language | Package | Provides |
|----------|---------|----------|
| JS/TS | `@noble/post-quantum` | ML-KEM, ML-DSA |
| Python | `oqs` (liboqs) | ML-KEM, ML-DSA, SLH-DSA |
| Go | `github.com/cloudflare/circl` | ML-KEM, ML-DSA |
| Rust | `pqcrypto` | ML-KEM, ML-DSA, SLH-DSA |
| Java/Kotlin | `bcpqc` (Bouncy Castle PQC) | ML-KEM, ML-DSA |

## CLI

```bash
npx qcrypt-migrate [path]                # scan path, generate terminal guide
npx qcrypt-migrate --scan-file r.json    # use existing scan results
npx qcrypt-migrate [path] --json         # JSON output
npx qcrypt-migrate [path] --markdown     # write migration-plan.md
npx qcrypt-migrate [path] --serve        # start web UI on port 3200
```

When no `--scan-file` is given, it runs qcrypt-scan internally on the path (defaults to `.`).

## API

Add to the existing Fastify server alongside bench endpoints:

```
POST /api/migrate              # generate migration plan
  Body: { path?: string, scanReport?: ScanReport }

GET  /api/migrate/history      # list past plans
GET  /api/migrate/:id          # get specific plan
```

If `scanReport` is provided, use it directly. If `path` is provided, run scan first. If neither, scan `.`.

## Web UI

Add a **Migrate** page to the existing sidebar (Dashboard, Comparison, Education, **Migrate**).

### Page Layout

- Path input + "Generate Plan" button
- OR "Upload Scan JSON" option
- Results displayed as phased sections: **Immediate** / **Short-term** / **Long-term**
- Each step is an expandable card:
  - File path and line number
  - Current code snippet (highlighted)
  - Suggested replacement code (highlighted)
  - Dependencies to add
  - Effort badge (low/medium/high)
  - Rollback notes
- Summary bar at top: X immediate, Y short-term, Z long-term
- "Download as Markdown" button

## Testing Strategy

### Unit Tests
- Migration step generation for each algorithm/language combination
- Priority mapping (risk → priority)
- Effort estimation
- Code example generation per language
- Dependency recommendation lookup

### Integration Tests
- Full pipeline: scan path → generate plan → verify all steps present
- Scan file input mode

### Reporter Tests
- Terminal output format
- Markdown output format and structure
- JSON output completeness

### E2E Tests
- CLI with `--scan-file` flag
- CLI with direct path
- API endpoints (POST /api/migrate, GET history, GET by id)

## Tech Stack

Same as qcrypt-bench (already in repo):
- TypeScript + Node.js 20+
- Fastify (API — extend existing server)
- commander (CLI)
- chalk (terminal output)
- Vitest (testing)
- React + Vite + Tailwind (web UI — extend existing app)

Plus:
- qcrypt-scan as a local dependency (import scan function directly)

## Out of Scope (v1)

- Automated code transformation (writing changes to files)
- PR generation
- CI/CD integration
- Custom migration rules
- Tracking migration progress over time
