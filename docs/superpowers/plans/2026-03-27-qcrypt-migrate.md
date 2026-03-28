# qcrypt-migrate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a migration guide generator that consumes qcrypt-scan results and produces prioritized, phased migration plans with language-aware code examples, dependency recommendations, and rollback guidance.

**Architecture:** Accepts scan JSON (file) or runs qcrypt-scan on a path, parses findings, generates migration steps grouped into immediate/short-term/long-term phases, and outputs as terminal (chalk), markdown, or JSON. Extends the existing qcrypt-bench Fastify server and React web UI.

**Tech Stack:** TypeScript, Node.js 20+, Fastify (extend existing server), Commander (CLI), chalk (terminal), Vitest (testing), React + Vite + Tailwind (extend existing web UI), qcrypt-scan (local file: dependency)

**Note:** When creating files, ensure parent directories exist (e.g., `mkdir -p src/migrate/steps`). All test imports use the `'../src/...'` alias convention defined in `vitest.config.ts`.

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `src/migrate/types.ts` | MigrationStep, MigrationPlan, Finding, ScanReport types |
| `src/migrate/steps/dependencies.ts` | Language detection and PQC package recommendations |
| `src/migrate/steps/code-examples.ts` | Language-aware before/after code snippets with fallback chains |
| `src/migrate/steps/generator.ts` | MigrationStep generation from Finding (priority, effort, action, code) |
| `src/migrate/index.ts` | Orchestrator: ScanReport in, MigrationPlan out |
| `src/migrate/scan-runner.ts` | Wraps qcrypt-scan for path-based scanning |
| `src/migrate/reporters/terminal.ts` | Chalk-formatted phased CLI output |
| `src/migrate/reporters/markdown.ts` | Markdown file generation |
| `src/migrate/reporters/json.ts` | JSON output |
| `src/migrate/cli.ts` | Commander entry point |
| `web/src/pages/Migrate.tsx` | Migration plan page with expandable step cards |
| `test/migrate/fixtures.ts` | Shared test data |
| `test/migrate/fixtures/sample-scan.json` | JSON fixture for CLI E2E tests |

### Modified Files
| File | Change |
|------|--------|
| `src/api/server.ts` | Add migrate API routes (POST, GET history, GET by id) |
| `package.json` | Add qcrypt-migrate bin entry, qcrypt-scan file: dependency |
| `web/src/api.ts` | Add MigrationPlan types and fetch functions |
| `web/src/App.tsx` | Add /migrate route |
| `web/src/components/Sidebar.tsx` | Add Migrate nav link |

---

### Task 1: Types and Test Fixtures

**Files:**
- Create: `src/migrate/types.ts`
- Create: `test/migrate/fixtures.ts`
- Create: `test/migrate/fixtures/sample-scan.json`
- Create: `test/migrate/types.test.ts`

- [ ] **Step 1: Create type definitions**

```bash
mkdir -p src/migrate/steps src/migrate/reporters test/migrate/steps test/migrate/reporters test/migrate/fixtures
```

Create `src/migrate/types.ts`:

```typescript
export type RiskLevel = 'CRITICAL' | 'WARNING' | 'INFO' | 'OK';
export type AlgorithmCategory = 'asymmetric' | 'symmetric' | 'hash' | 'protocol';
export type Priority = 'immediate' | 'short-term' | 'long-term';
export type Effort = 'low' | 'medium' | 'high';

export interface Finding {
  file: string;
  line: number;
  algorithm: string;
  category: AlgorithmCategory;
  risk: RiskLevel;
  snippet: string;
  explanation: string;
  replacement: string;
}

export interface ScanReport {
  id: string;
  path: string;
  scannedAt: string;
  filesScanned: number;
  findings: Finding[];
  summary: { critical: number; warning: number; info: number; ok: number };
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface MigrationStep {
  finding: Finding;
  priority: Priority;
  action: string;
  codeExample: string;
  dependencies: string[];
  effort: Effort;
  notes: string;
}

export interface MigrationPlan {
  id: string;
  generatedAt: string;
  scanReport: ScanReport;
  steps: MigrationStep[];
  summary: { immediate: number; shortTerm: number; longTerm: number };
  estimatedEffort: string;
}
```

- [ ] **Step 2: Create test fixtures**

Create `test/migrate/fixtures.ts`:

```typescript
import type { Finding, ScanReport } from '../src/migrate/types.js';

export const CRITICAL_RSA_FINDING: Finding = {
  file: 'src/auth.ts',
  line: 15,
  algorithm: 'RSA-2048',
  category: 'asymmetric',
  risk: 'CRITICAL',
  snippet: "crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })",
  explanation: "RSA-2048 is vulnerable to Shor's algorithm",
  replacement: 'ML-KEM-768',
};

export const CRITICAL_ECDSA_FINDING: Finding = {
  file: 'src/auth.ts',
  line: 42,
  algorithm: 'ECDSA-P256',
  category: 'asymmetric',
  risk: 'CRITICAL',
  snippet: "crypto.sign('sha256', data, ecPrivateKey)",
  explanation: "ECDSA is vulnerable to Shor's algorithm",
  replacement: 'ML-DSA-65',
};

export const WARNING_MD5_FINDING: Finding = {
  file: 'src/utils/hash.py',
  line: 8,
  algorithm: 'MD5',
  category: 'hash',
  risk: 'WARNING',
  snippet: 'hashlib.md5(data)',
  explanation: "MD5 weakened by Grover's algorithm",
  replacement: 'SHA3-256',
};

export const WARNING_AES128_FINDING: Finding = {
  file: 'src/config.ts',
  line: 23,
  algorithm: 'AES-128-GCM',
  category: 'symmetric',
  risk: 'WARNING',
  snippet: "crypto.createCipheriv('aes-128-gcm', key16, iv)",
  explanation: "AES-128 security halved by Grover's algorithm",
  replacement: 'AES-256-GCM',
};

export const INFO_AES192_FINDING: Finding = {
  file: 'src/legacy.go',
  line: 5,
  algorithm: 'AES-192',
  category: 'symmetric',
  risk: 'INFO',
  snippet: 'aes.NewCipher(key24)',
  explanation: 'AES-192 has reduced security margin',
  replacement: 'AES-256',
};

export const OK_AES256_FINDING: Finding = {
  file: 'src/modern.ts',
  line: 10,
  algorithm: 'AES-256-GCM',
  category: 'symmetric',
  risk: 'OK',
  snippet: "crypto.createCipheriv('aes-256-gcm', key32, iv)",
  explanation: 'AES-256 is quantum-resistant',
  replacement: 'No change needed',
};

export const SAMPLE_FINDINGS: Finding[] = [
  CRITICAL_RSA_FINDING,
  CRITICAL_ECDSA_FINDING,
  WARNING_MD5_FINDING,
  WARNING_AES128_FINDING,
  INFO_AES192_FINDING,
  OK_AES256_FINDING,
];

export const SAMPLE_SCAN_REPORT: ScanReport = {
  id: 'test-scan-001',
  path: '/tmp/test-project',
  scannedAt: '2026-03-27T12:00:00.000Z',
  filesScanned: 10,
  findings: SAMPLE_FINDINGS,
  summary: { critical: 2, warning: 2, info: 1, ok: 1 },
  grade: 'C',
};
```

Create `test/migrate/fixtures/sample-scan.json`:

```json
{
  "id": "test-scan-001",
  "path": "/tmp/test-project",
  "scannedAt": "2026-03-27T12:00:00.000Z",
  "filesScanned": 10,
  "findings": [
    {
      "file": "src/auth.ts",
      "line": 15,
      "algorithm": "RSA-2048",
      "category": "asymmetric",
      "risk": "CRITICAL",
      "snippet": "crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })",
      "explanation": "RSA-2048 is vulnerable to Shor's algorithm",
      "replacement": "ML-KEM-768"
    },
    {
      "file": "src/utils/hash.py",
      "line": 8,
      "algorithm": "MD5",
      "category": "hash",
      "risk": "WARNING",
      "snippet": "hashlib.md5(data)",
      "explanation": "MD5 weakened by Grover's algorithm",
      "replacement": "SHA3-256"
    },
    {
      "file": "src/config.ts",
      "line": 23,
      "algorithm": "AES-128-GCM",
      "category": "symmetric",
      "risk": "WARNING",
      "snippet": "crypto.createCipheriv('aes-128-gcm', key16, iv)",
      "explanation": "AES-128 security halved by Grover's algorithm",
      "replacement": "AES-256-GCM"
    },
    {
      "file": "src/legacy.go",
      "line": 5,
      "algorithm": "AES-192",
      "category": "symmetric",
      "risk": "INFO",
      "snippet": "aes.NewCipher(key24)",
      "explanation": "AES-192 has reduced security margin",
      "replacement": "AES-256"
    }
  ],
  "summary": { "critical": 1, "warning": 2, "info": 1, "ok": 0 },
  "grade": "C"
}
```

- [ ] **Step 3: Write and run types test**

Create `test/migrate/types.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type {
  Finding,
  ScanReport,
  MigrationStep,
  MigrationPlan,
  Priority,
  Effort,
} from '../src/migrate/types.js';

describe('migrate types', () => {
  it('Finding accepts valid data', () => {
    const finding: Finding = {
      file: 'src/auth.ts',
      line: 15,
      algorithm: 'RSA-2048',
      category: 'asymmetric',
      risk: 'CRITICAL',
      snippet: "generateKeyPairSync('rsa')",
      explanation: 'Vulnerable to quantum attack',
      replacement: 'ML-KEM-768',
    };
    expect(finding.algorithm).toBe('RSA-2048');
    expect(finding.risk).toBe('CRITICAL');
  });

  it('MigrationStep accepts valid data', () => {
    const step: MigrationStep = {
      finding: {
        file: 'src/auth.ts', line: 15, algorithm: 'RSA-2048', category: 'asymmetric',
        risk: 'CRITICAL', snippet: '', explanation: '', replacement: 'ML-KEM-768',
      },
      priority: 'immediate',
      action: 'Replace RSA-2048 with ML-KEM-768',
      codeExample: '// Before:\ncrypto.generateKeyPair("rsa")\n\n// After:\nml_kem768.keygen()',
      dependencies: ['@noble/post-quantum'],
      effort: 'high',
      notes: 'Key formats change.',
    };
    expect(step.priority).toBe('immediate');
    expect(step.effort).toBe('high');
  });

  it('MigrationPlan accepts valid data', () => {
    const plan: MigrationPlan = {
      id: 'test-plan-001',
      generatedAt: '2026-03-27T12:00:00Z',
      scanReport: {
        id: 'test-scan', path: '.', scannedAt: '', filesScanned: 1,
        findings: [], summary: { critical: 0, warning: 0, info: 0, ok: 0 }, grade: 'A',
      },
      steps: [],
      summary: { immediate: 0, shortTerm: 0, longTerm: 0 },
      estimatedEffort: '0 changes across 0 files',
    };
    expect(plan.steps).toEqual([]);
    expect(plan.summary.immediate).toBe(0);
  });

  it('Priority and Effort cover all values', () => {
    const priorities: Priority[] = ['immediate', 'short-term', 'long-term'];
    const efforts: Effort[] = ['low', 'medium', 'high'];
    expect(priorities).toHaveLength(3);
    expect(efforts).toHaveLength(3);
  });
});
```

Run: `npx vitest run test/migrate/types.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/migrate/types.ts test/migrate/
git commit -m "feat(migrate): add types and test fixtures"
```

---

### Task 2: Language Detection and Dependency Recommendations

**Files:**
- Create: `test/migrate/steps/dependencies.test.ts`
- Create: `src/migrate/steps/dependencies.ts`

- [ ] **Step 1: Write the failing test**

Create `test/migrate/steps/dependencies.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { detectLanguage, getDependencies } from '../src/migrate/steps/dependencies.js';

describe('detectLanguage', () => {
  it('detects JavaScript from .js extension', () => {
    expect(detectLanguage('src/auth.js')).toBe('javascript');
  });

  it('detects TypeScript from .ts extension', () => {
    expect(detectLanguage('src/auth.ts')).toBe('typescript');
  });

  it('detects Python from .py extension', () => {
    expect(detectLanguage('utils/hash.py')).toBe('python');
  });

  it('detects Go from .go extension', () => {
    expect(detectLanguage('main.go')).toBe('go');
  });

  it('detects Rust from .rs extension', () => {
    expect(detectLanguage('src/lib.rs')).toBe('rust');
  });

  it('detects Java from .java extension', () => {
    expect(detectLanguage('Auth.java')).toBe('java');
  });

  it('detects Kotlin from .kt extension', () => {
    expect(detectLanguage('Auth.kt')).toBe('kotlin');
  });

  it('returns unknown for unrecognized extensions', () => {
    expect(detectLanguage('readme.md')).toBe('unknown');
    expect(detectLanguage('config.yaml')).toBe('unknown');
  });
});

describe('getDependencies', () => {
  it('returns @noble/post-quantum for JS asymmetric', () => {
    expect(getDependencies('javascript', 'asymmetric')).toEqual(['@noble/post-quantum']);
  });

  it('returns @noble/post-quantum for TS asymmetric', () => {
    expect(getDependencies('typescript', 'asymmetric')).toEqual(['@noble/post-quantum']);
  });

  it('returns oqs for Python asymmetric', () => {
    expect(getDependencies('python', 'asymmetric')).toEqual(['oqs']);
  });

  it('returns circl for Go asymmetric', () => {
    expect(getDependencies('go', 'asymmetric')).toEqual(['github.com/cloudflare/circl']);
  });

  it('returns golang.org/x/crypto/sha3 for Go hash', () => {
    expect(getDependencies('go', 'hash')).toEqual(['golang.org/x/crypto/sha3']);
  });

  it('returns pqcrypto for Rust asymmetric', () => {
    expect(getDependencies('rust', 'asymmetric')).toEqual(['pqcrypto']);
  });

  it('returns bcpqc for Java asymmetric', () => {
    expect(getDependencies('java', 'asymmetric')).toEqual(['bcpqc']);
  });

  it('returns empty array for JS hash (built-in)', () => {
    expect(getDependencies('javascript', 'hash')).toEqual([]);
  });

  it('returns empty array for JS symmetric (built-in)', () => {
    expect(getDependencies('javascript', 'symmetric')).toEqual([]);
  });

  it('returns empty array for unknown language', () => {
    expect(getDependencies('unknown', 'asymmetric')).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/migrate/steps/dependencies.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write implementation**

Create `src/migrate/steps/dependencies.ts`:

```typescript
import path from 'node:path';
import type { AlgorithmCategory } from '../types.js';

const LANGUAGE_MAP: Record<string, string> = {
  '.js': 'javascript', '.mjs': 'javascript', '.cjs': 'javascript', '.jsx': 'javascript',
  '.ts': 'typescript', '.tsx': 'typescript', '.mts': 'typescript',
  '.py': 'python', '.pyw': 'python',
  '.go': 'go',
  '.rs': 'rust',
  '.java': 'java',
  '.kt': 'kotlin', '.kts': 'kotlin',
};

export function detectLanguage(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return LANGUAGE_MAP[ext] || 'unknown';
}

const DEPENDENCY_MAP: Record<string, Record<string, string[]>> = {
  javascript: { asymmetric: ['@noble/post-quantum'] },
  typescript: { asymmetric: ['@noble/post-quantum'] },
  python: { asymmetric: ['oqs'] },
  go: {
    asymmetric: ['github.com/cloudflare/circl'],
    hash: ['golang.org/x/crypto/sha3'],
  },
  rust: { asymmetric: ['pqcrypto'] },
  java: { asymmetric: ['bcpqc'] },
  kotlin: { asymmetric: ['bcpqc'] },
};

export function getDependencies(language: string, category: AlgorithmCategory): string[] {
  return DEPENDENCY_MAP[language]?.[category] ?? [];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/migrate/steps/dependencies.test.ts`
Expected: PASS — all 18 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/migrate/steps/dependencies.ts test/migrate/steps/dependencies.test.ts
git commit -m "feat(migrate): add language detection and dependency recommendations"
```

---

### Task 3: Code Examples

**Files:**
- Create: `test/migrate/steps/code-examples.test.ts`
- Create: `src/migrate/steps/code-examples.ts`

- [ ] **Step 1: Write the failing test**

Create `test/migrate/steps/code-examples.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  normalizeAlgorithm,
  getCodeExample,
  formatCodeExample,
  GENERIC_GUIDANCE,
} from '../src/migrate/steps/code-examples.js';

describe('normalizeAlgorithm', () => {
  it('normalizes RSA variants to rsa', () => {
    expect(normalizeAlgorithm('RSA-2048')).toBe('rsa');
    expect(normalizeAlgorithm('RSA-4096')).toBe('rsa');
  });

  it('normalizes ECDSA and EdDSA variants to ecdsa', () => {
    expect(normalizeAlgorithm('ECDSA-P256')).toBe('ecdsa');
    expect(normalizeAlgorithm('Ed25519')).toBe('ecdsa');
  });

  it('normalizes ECDH and X25519 to ecdh', () => {
    expect(normalizeAlgorithm('ECDH-P256')).toBe('ecdh');
    expect(normalizeAlgorithm('X25519')).toBe('ecdh');
  });

  it('normalizes hash algorithms', () => {
    expect(normalizeAlgorithm('MD5')).toBe('md5');
    expect(normalizeAlgorithm('SHA-1')).toBe('sha1');
  });

  it('normalizes symmetric algorithms', () => {
    expect(normalizeAlgorithm('AES-128-GCM')).toBe('aes128');
    expect(normalizeAlgorithm('AES-192')).toBe('aes192');
    expect(normalizeAlgorithm('DES')).toBe('des');
    expect(normalizeAlgorithm('3DES')).toBe('des');
    expect(normalizeAlgorithm('RC4')).toBe('des');
  });
});

describe('getCodeExample', () => {
  it('returns JS RSA example for .ts file with RSA-2048', () => {
    const example = getCodeExample('RSA-2048', 'src/auth.ts');
    expect(example).not.toBeNull();
    expect(example!.before).toContain('generateKeyPairSync');
    expect(example!.after).toContain('ml_kem768');
    expect(example!.package).toBe('@noble/post-quantum');
  });

  it('returns Python MD5 example for .py file with MD5', () => {
    const example = getCodeExample('MD5', 'utils/hash.py');
    expect(example).not.toBeNull();
    expect(example!.before).toContain('hashlib.md5');
    expect(example!.after).toContain('sha3_256');
  });

  it('returns Go RSA example for .go file', () => {
    const example = getCodeExample('RSA-2048', 'main.go');
    expect(example).not.toBeNull();
    expect(example!.after).toContain('circl');
  });

  it('falls back from TypeScript to JavaScript examples', () => {
    const tsExample = getCodeExample('RSA-2048', 'auth.ts');
    const jsExample = getCodeExample('RSA-2048', 'auth.js');
    expect(tsExample).not.toBeNull();
    expect(tsExample!.after).toBe(jsExample!.after);
  });

  it('falls back from Kotlin to Java examples', () => {
    const ktExample = getCodeExample('RSA-2048', 'Auth.kt');
    const javaExample = getCodeExample('RSA-2048', 'Auth.java');
    expect(ktExample).not.toBeNull();
    expect(ktExample!.after).toBe(javaExample!.after);
  });

  it('uses algorithm fallback (sha1 falls back to md5 example)', () => {
    const example = getCodeExample('SHA-1', 'auth.js');
    expect(example).not.toBeNull();
    expect(example!.after).toContain('sha3-256');
  });

  it('returns null for completely unknown combo', () => {
    const example = getCodeExample('UNKNOWN-ALGO', 'file.unknown');
    expect(example).toBeNull();
  });
});

describe('formatCodeExample', () => {
  it('formats before and after sections', () => {
    const formatted = formatCodeExample({
      before: 'old_code()',
      after: 'new_code()',
      package: 'test-pkg',
    });
    expect(formatted).toContain('// Before:');
    expect(formatted).toContain('old_code()');
    expect(formatted).toContain('// After:');
    expect(formatted).toContain('new_code()');
  });
});

describe('GENERIC_GUIDANCE', () => {
  it('mentions NIST FIPS standards', () => {
    expect(GENERIC_GUIDANCE).toContain('NIST FIPS');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/migrate/steps/code-examples.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write implementation**

Create `src/migrate/steps/code-examples.ts`:

```typescript
import { detectLanguage } from './dependencies.js';

export interface CodeExample {
  before: string;
  after: string;
  package: string;
}

export function normalizeAlgorithm(algorithm: string): string {
  const lower = algorithm.toLowerCase();
  if (lower.startsWith('rsa')) return 'rsa';
  if (lower.includes('ecdsa') || lower.includes('ed25519') || lower.includes('eddsa')) return 'ecdsa';
  if (lower.includes('ecdh') || lower.includes('x25519')) return 'ecdh';
  if (lower === 'dsa') return 'dsa';
  if (lower === 'dh' || lower.startsWith('diffie')) return 'dh';
  if (lower === 'md5') return 'md5';
  if (lower.startsWith('sha-1') || lower === 'sha1') return 'sha1';
  if (lower.includes('aes-128') || lower.includes('aes128')) return 'aes128';
  if (lower.includes('aes-192') || lower.includes('aes192')) return 'aes192';
  if (lower.includes('des') || lower === '3des' || lower === 'rc4') return 'des';
  return lower;
}

// Key format: `${normalizedAlgorithm}:${language}`
const CODE_EXAMPLES: Record<string, CodeExample> = {
  // ── JavaScript / TypeScript ──
  'rsa:javascript': {
    before: "crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })",
    after: "import { ml_kem768 } from '@noble/post-quantum/ml-kem';\nconst { publicKey, secretKey } = ml_kem768.keygen();",
    package: '@noble/post-quantum',
  },
  'ecdsa:javascript': {
    before: "crypto.sign('sha256', data, ecPrivateKey)",
    after: "import { ml_dsa65 } from '@noble/post-quantum/ml-dsa';\nconst sig = ml_dsa65.sign(secretKey, data);",
    package: '@noble/post-quantum',
  },
  'md5:javascript': {
    before: "crypto.createHash('md5').update(data).digest()",
    after: "crypto.createHash('sha3-256').update(data).digest()",
    package: '(built-in)',
  },
  'aes128:javascript': {
    before: "crypto.createCipheriv('aes-128-gcm', key16, iv)",
    after: "crypto.createCipheriv('aes-256-gcm', key32, iv)",
    package: '(built-in)',
  },
  'ecdh:javascript': {
    before: "crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' })",
    after: "import { ml_kem768 } from '@noble/post-quantum/ml-kem';\nconst { publicKey, secretKey } = ml_kem768.keygen();",
    package: '@noble/post-quantum',
  },

  // ── Python ──
  'rsa:python': {
    before: 'rsa.generate_private_key(public_exponent=65537, key_size=2048)',
    after: "from oqs import KeyEncapsulation\nkem = KeyEncapsulation('ML-KEM-768')\npk, sk = kem.generate_keypair()",
    package: 'oqs',
  },
  'ecdsa:python': {
    before: 'ec.generate_private_key(SECP256R1())',
    after: "from oqs import Signature\nsig = Signature('ML-DSA-65')\npk, sk = sig.generate_keypair()",
    package: 'oqs',
  },
  'md5:python': {
    before: 'hashlib.md5(data)',
    after: 'hashlib.sha3_256(data)',
    package: '(built-in)',
  },
  'aes128:python': {
    before: 'AES.new(key, AES.MODE_GCM)  # 16-byte key',
    after: 'AES.new(key, AES.MODE_GCM)  # 32-byte key',
    package: '(same package)',
  },

  // ── Go ──
  'rsa:go': {
    before: 'rsa.GenerateKey(rand.Reader, 2048)',
    after: 'import "github.com/cloudflare/circl/kem/mlkem/mlkem768"',
    package: 'github.com/cloudflare/circl',
  },
  'ecdsa:go': {
    before: 'ecdsa.GenerateKey(elliptic.P256(), rand.Reader)',
    after: 'import "github.com/cloudflare/circl/sign/mldsa/mldsa65"',
    package: 'github.com/cloudflare/circl',
  },
  'md5:go': {
    before: 'md5.Sum(data)',
    after: 'sha3.Sum256(data)',
    package: 'golang.org/x/crypto/sha3',
  },

  // ── Rust ──
  'rsa:rust': {
    before: 'rsa::RsaPrivateKey::new(&mut rng, 2048)',
    after: 'use pqcrypto_mlkem::mlkem768::*;\nlet (pk, sk) = keypair();',
    package: 'pqcrypto',
  },
  'ecdsa:rust': {
    before: 'ecdsa::SigningKey::random(&mut rng)',
    after: 'use pqcrypto_mldsa::mldsa65::*;\nlet (pk, sk) = keypair();',
    package: 'pqcrypto',
  },

  // ── Java / Kotlin ──
  'rsa:java': {
    before: 'KeyPairGenerator.getInstance("RSA")',
    after: 'KeyPairGenerator.getInstance("ML-KEM", "BCPQC")',
    package: 'bcpqc (Bouncy Castle)',
  },
  'ecdsa:java': {
    before: 'KeyPairGenerator.getInstance("EC")',
    after: 'KeyPairGenerator.getInstance("ML-DSA", "BCPQC")',
    package: 'bcpqc (Bouncy Castle)',
  },
  'md5:java': {
    before: 'MessageDigest.getInstance("MD5")',
    after: 'MessageDigest.getInstance("SHA3-256")',
    package: '(built-in)',
  },
};

const LANG_FALLBACKS: Record<string, string> = {
  typescript: 'javascript',
  kotlin: 'java',
};

const ALGO_FALLBACKS: Record<string, string> = {
  dsa: 'ecdsa',
  dh: 'ecdh',
  sha1: 'md5',
  des: 'aes128',
  rc4: 'aes128',
  aes192: 'aes128',
};

export function getCodeExample(algorithm: string, filePath: string): CodeExample | null {
  const algo = normalizeAlgorithm(algorithm);
  const lang = detectLanguage(filePath);

  const algos = [algo];
  if (ALGO_FALLBACKS[algo]) algos.push(ALGO_FALLBACKS[algo]);

  const langs = [lang];
  if (LANG_FALLBACKS[lang]) langs.push(LANG_FALLBACKS[lang]);

  for (const a of algos) {
    for (const l of langs) {
      const key = `${a}:${l}`;
      if (CODE_EXAMPLES[key]) return CODE_EXAMPLES[key];
    }
  }

  return null;
}

export function formatCodeExample(example: CodeExample): string {
  return `// Before:\n${example.before}\n\n// After:\n${example.after}`;
}

export const GENERIC_GUIDANCE =
  'No language-specific code example available.\nSee NIST FIPS 203/204/205 for PQC standards.\nConsider hybrid approaches during transition.';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/migrate/steps/code-examples.test.ts`
Expected: PASS — all 13 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/migrate/steps/code-examples.ts test/migrate/steps/code-examples.test.ts
git commit -m "feat(migrate): add language-aware code examples with fallback chains"
```

---

### Task 4: Migration Step Generator

**Files:**
- Create: `test/migrate/steps/generator.test.ts`
- Create: `src/migrate/steps/generator.ts`

- [ ] **Step 1: Write the failing test**

Create `test/migrate/steps/generator.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  mapRiskToPriority,
  estimateEffort,
  generateAction,
  generateMigrationStep,
} from '../src/migrate/steps/generator.js';
import {
  CRITICAL_RSA_FINDING,
  WARNING_MD5_FINDING,
  WARNING_AES128_FINDING,
  INFO_AES192_FINDING,
  OK_AES256_FINDING,
} from '../fixtures.js';

describe('mapRiskToPriority', () => {
  it('maps CRITICAL to immediate', () => {
    expect(mapRiskToPriority('CRITICAL')).toBe('immediate');
  });

  it('maps WARNING to short-term', () => {
    expect(mapRiskToPriority('WARNING')).toBe('short-term');
  });

  it('maps INFO to long-term', () => {
    expect(mapRiskToPriority('INFO')).toBe('long-term');
  });

  it('returns null for OK', () => {
    expect(mapRiskToPriority('OK')).toBeNull();
  });
});

describe('estimateEffort', () => {
  it('returns high for asymmetric', () => {
    expect(estimateEffort(CRITICAL_RSA_FINDING)).toBe('high');
  });

  it('returns low for hash', () => {
    expect(estimateEffort(WARNING_MD5_FINDING)).toBe('low');
  });

  it('returns low for symmetric', () => {
    expect(estimateEffort(WARNING_AES128_FINDING)).toBe('low');
  });
});

describe('generateAction', () => {
  it('says Replace for asymmetric algorithms', () => {
    const action = generateAction(CRITICAL_RSA_FINDING);
    expect(action).toBe('Replace RSA-2048 with ML-KEM-768');
  });

  it('says Upgrade for non-critical symmetric algorithms', () => {
    const action = generateAction(WARNING_AES128_FINDING);
    expect(action).toBe('Upgrade AES-128-GCM to AES-256-GCM');
  });
});

describe('generateMigrationStep', () => {
  it('generates a complete step for a CRITICAL finding', () => {
    const step = generateMigrationStep(CRITICAL_RSA_FINDING);
    expect(step).not.toBeNull();
    expect(step!.priority).toBe('immediate');
    expect(step!.effort).toBe('high');
    expect(step!.action).toContain('RSA-2048');
    expect(step!.codeExample).toContain('// Before:');
    expect(step!.dependencies).toContain('@noble/post-quantum');
    expect(step!.notes).toContain('Key formats change');
  });

  it('generates a step for a WARNING hash finding', () => {
    const step = generateMigrationStep(WARNING_MD5_FINDING);
    expect(step).not.toBeNull();
    expect(step!.priority).toBe('short-term');
    expect(step!.effort).toBe('low');
    expect(step!.codeExample).toContain('sha3_256');
  });

  it('generates a step for an INFO finding', () => {
    const step = generateMigrationStep(INFO_AES192_FINDING);
    expect(step).not.toBeNull();
    expect(step!.priority).toBe('long-term');
  });

  it('returns null for OK findings', () => {
    const step = generateMigrationStep(OK_AES256_FINDING);
    expect(step).toBeNull();
  });

  it('includes finding reference in the returned step', () => {
    const step = generateMigrationStep(CRITICAL_RSA_FINDING);
    expect(step!.finding).toBe(CRITICAL_RSA_FINDING);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/migrate/steps/generator.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write implementation**

Create `src/migrate/steps/generator.ts`:

```typescript
import type { Finding, MigrationStep, Priority, Effort, RiskLevel } from '../types.js';
import { getCodeExample, formatCodeExample, GENERIC_GUIDANCE } from './code-examples.js';
import { getDependencies, detectLanguage } from './dependencies.js';

const PRIORITY_MAP: Record<string, Priority> = {
  CRITICAL: 'immediate',
  WARNING: 'short-term',
  INFO: 'long-term',
};

export function mapRiskToPriority(risk: RiskLevel): Priority | null {
  return PRIORITY_MAP[risk] ?? null;
}

export function estimateEffort(finding: Finding): Effort {
  if (finding.category === 'asymmetric') return 'high';
  if (finding.category === 'protocol') return 'medium';
  return 'low';
}

export function generateAction(finding: Finding): string {
  if (finding.category === 'symmetric' && finding.risk !== 'CRITICAL') {
    return `Upgrade ${finding.algorithm} to ${finding.replacement}`;
  }
  return `Replace ${finding.algorithm} with ${finding.replacement}`;
}

const ROLLBACK_NOTES: Record<string, string> = {
  asymmetric:
    'Key formats change. Test key generation, signing/verification, and key exchange. Consider hybrid mode (classical + PQC) during transition.',
  hash:
    'Hash output changes. Update any stored hashes and verification logic. Cannot decrypt data hashed with old algorithm.',
  symmetric:
    'Key size change requires new key generation. Existing encrypted data needs re-encryption or dual-cipher support during migration.',
  protocol:
    'Protocol change may break existing clients. Coordinate upgrade with all consumers. Support both versions during transition.',
};

export function generateMigrationStep(finding: Finding): MigrationStep | null {
  const priority = mapRiskToPriority(finding.risk);
  if (!priority) return null;

  const lang = detectLanguage(finding.file);
  const example = getCodeExample(finding.algorithm, finding.file);
  const dependencies = getDependencies(lang, finding.category);

  return {
    finding,
    priority,
    action: generateAction(finding),
    codeExample: example ? formatCodeExample(example) : GENERIC_GUIDANCE,
    dependencies,
    effort: estimateEffort(finding),
    notes: ROLLBACK_NOTES[finding.category] ?? '',
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/migrate/steps/generator.test.ts`
Expected: PASS — all 12 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/migrate/steps/generator.ts test/migrate/steps/generator.test.ts
git commit -m "feat(migrate): add migration step generator with priority/effort mapping"
```

---

### Task 5: Migration Plan Orchestrator

**Files:**
- Create: `test/migrate/index.test.ts`
- Create: `src/migrate/index.ts`

- [ ] **Step 1: Write the failing test**

Create `test/migrate/index.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { generateMigrationPlan } from '../src/migrate/index.js';
import { SAMPLE_SCAN_REPORT, OK_AES256_FINDING } from './fixtures.js';
import type { ScanReport } from '../src/migrate/types.js';

describe('generateMigrationPlan', () => {
  it('generates a plan from a scan report', () => {
    const plan = generateMigrationPlan(SAMPLE_SCAN_REPORT);
    expect(plan.id).toBeTruthy();
    expect(plan.generatedAt).toBeTruthy();
    expect(plan.scanReport).toBe(SAMPLE_SCAN_REPORT);
  });

  it('filters out OK findings (no migration needed)', () => {
    const plan = generateMigrationPlan(SAMPLE_SCAN_REPORT);
    const algorithms = plan.steps.map((s) => s.finding.algorithm);
    expect(algorithms).not.toContain('AES-256-GCM');
  });

  it('includes steps for CRITICAL, WARNING, and INFO findings', () => {
    const plan = generateMigrationPlan(SAMPLE_SCAN_REPORT);
    // SAMPLE_SCAN_REPORT has: 2 CRITICAL, 2 WARNING, 1 INFO, 1 OK → 5 steps
    expect(plan.steps.length).toBe(5);
  });

  it('calculates summary counts correctly', () => {
    const plan = generateMigrationPlan(SAMPLE_SCAN_REPORT);
    expect(plan.summary.immediate).toBe(2);
    expect(plan.summary.shortTerm).toBe(2);
    expect(plan.summary.longTerm).toBe(1);
  });

  it('calculates estimated effort string', () => {
    const plan = generateMigrationPlan(SAMPLE_SCAN_REPORT);
    expect(plan.estimatedEffort).toContain('5 changes');
    expect(plan.estimatedEffort).toContain('files');
  });

  it('handles empty findings', () => {
    const emptyReport: ScanReport = {
      ...SAMPLE_SCAN_REPORT,
      findings: [],
      summary: { critical: 0, warning: 0, info: 0, ok: 0 },
      grade: 'A',
    };
    const plan = generateMigrationPlan(emptyReport);
    expect(plan.steps).toEqual([]);
    expect(plan.summary).toEqual({ immediate: 0, shortTerm: 0, longTerm: 0 });
    expect(plan.estimatedEffort).toBe('0 changes across 0 files');
  });

  it('handles report with only OK findings', () => {
    const okReport: ScanReport = {
      ...SAMPLE_SCAN_REPORT,
      findings: [OK_AES256_FINDING],
      summary: { critical: 0, warning: 0, info: 0, ok: 1 },
    };
    const plan = generateMigrationPlan(okReport);
    expect(plan.steps).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/migrate/index.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write implementation**

Create `src/migrate/index.ts`:

```typescript
import { randomUUID } from 'node:crypto';
import type { ScanReport, MigrationPlan, MigrationStep } from './types.js';
import { generateMigrationStep } from './steps/generator.js';

export function generateMigrationPlan(scanReport: ScanReport): MigrationPlan {
  const steps: MigrationStep[] = [];

  for (const finding of scanReport.findings) {
    const step = generateMigrationStep(finding);
    if (step) steps.push(step);
  }

  const summary = {
    immediate: steps.filter((s) => s.priority === 'immediate').length,
    shortTerm: steps.filter((s) => s.priority === 'short-term').length,
    longTerm: steps.filter((s) => s.priority === 'long-term').length,
  };

  const fileCount = new Set(steps.map((s) => s.finding.file)).size;

  return {
    id: randomUUID(),
    generatedAt: new Date().toISOString(),
    scanReport,
    steps,
    summary,
    estimatedEffort: `${steps.length} changes across ${fileCount} files`,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/migrate/index.test.ts`
Expected: PASS — all 7 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/migrate/index.ts test/migrate/index.test.ts
git commit -m "feat(migrate): add migration plan orchestrator"
```

---

### Task 6: Terminal Reporter

**Files:**
- Create: `test/migrate/reporters/terminal.test.ts`
- Create: `src/migrate/reporters/terminal.ts`

- [ ] **Step 1: Write the failing test**

Create `test/migrate/reporters/terminal.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { formatTerminal } from '../src/migrate/reporters/terminal.js';
import { generateMigrationPlan } from '../src/migrate/index.js';
import { SAMPLE_SCAN_REPORT } from '../fixtures.js';

describe('formatTerminal', () => {
  const plan = generateMigrationPlan(SAMPLE_SCAN_REPORT);
  const output = formatTerminal(plan);

  it('includes the header', () => {
    expect(output).toContain('qcrypt-migrate');
    expect(output).toContain('Migration Guide');
  });

  it('includes summary counts', () => {
    expect(output).toContain('Immediate');
    expect(output).toContain('Short-term');
    expect(output).toContain('Long-term');
  });

  it('includes scan info', () => {
    expect(output).toContain(SAMPLE_SCAN_REPORT.path);
    expect(output).toContain('grade');
  });

  it('includes step actions', () => {
    expect(output).toContain('RSA-2048');
    expect(output).toContain('MD5');
    expect(output).toContain('AES-128-GCM');
  });

  it('includes file references', () => {
    expect(output).toContain('src/auth.ts:15');
    expect(output).toContain('src/utils/hash.py:8');
  });

  it('includes phase sections', () => {
    expect(output).toContain('Immediate (Critical)');
    expect(output).toContain('Short-term (Warning)');
    expect(output).toContain('Long-term (Info)');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/migrate/reporters/terminal.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write implementation**

Create `src/migrate/reporters/terminal.ts`:

```typescript
import chalk from 'chalk';
import type { MigrationPlan, MigrationStep } from '../types.js';

function header(): string {
  return [
    '',
    chalk.bold.green('  qcrypt-migrate') + '  Post-Quantum Migration Guide',
    chalk.dim('  ─'.repeat(28)),
    '',
  ].join('\n');
}

function summarySection(plan: MigrationPlan): string {
  const { summary, scanReport, estimatedEffort } = plan;
  return [
    chalk.bold('  Summary'),
    `    Scan:       ${scanReport.path} (${scanReport.filesScanned} files, grade ${scanReport.grade})`,
    `    Changes:    ${estimatedEffort}`,
    `    ${chalk.red(`Immediate: ${summary.immediate}`)}  ${chalk.yellow(`Short-term: ${summary.shortTerm}`)}  ${chalk.blue(`Long-term: ${summary.longTerm}`)}`,
    '',
  ].join('\n');
}

const PRIORITY_COLOR = {
  immediate: chalk.red,
  'short-term': chalk.yellow,
  'long-term': chalk.blue,
};

const EFFORT_COLOR = {
  low: chalk.green,
  medium: chalk.yellow,
  high: chalk.red,
};

function stepBlock(step: MigrationStep, index: number): string {
  const pColor = PRIORITY_COLOR[step.priority];
  const eColor = EFFORT_COLOR[step.effort];

  const lines = [
    `  ${chalk.bold(`${index + 1}.`)} ${pColor(`[${step.priority}]`)} ${step.action}`,
    `     ${chalk.dim(`${step.finding.file}:${step.finding.line}`)} ${eColor(`effort: ${step.effort}`)}`,
    '',
    ...step.codeExample.split('\n').map((line) => `     ${chalk.dim(line)}`),
    '',
  ];

  if (step.dependencies.length > 0) {
    lines.push(`     ${chalk.cyan('Dependencies:')} ${step.dependencies.join(', ')}`);
  }

  lines.push(`     ${chalk.dim('Note:')} ${step.notes}`, '');

  return lines.join('\n');
}

function phaseSection(title: string, steps: MigrationStep[], startIndex: number): string {
  if (steps.length === 0) return '';
  const lines = [chalk.bold(`  ── ${title} ──`), ''];
  for (let i = 0; i < steps.length; i++) {
    lines.push(stepBlock(steps[i], startIndex + i));
  }
  return lines.join('\n');
}

export function formatTerminal(plan: MigrationPlan): string {
  const immediate = plan.steps.filter((s) => s.priority === 'immediate');
  const shortTerm = plan.steps.filter((s) => s.priority === 'short-term');
  const longTerm = plan.steps.filter((s) => s.priority === 'long-term');

  return [
    header(),
    summarySection(plan),
    phaseSection('Immediate (Critical)', immediate, 0),
    phaseSection('Short-term (Warning)', shortTerm, immediate.length),
    phaseSection('Long-term (Info)', longTerm, immediate.length + shortTerm.length),
  ].join('\n');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/migrate/reporters/terminal.test.ts`
Expected: PASS — all 6 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/migrate/reporters/terminal.ts test/migrate/reporters/terminal.test.ts
git commit -m "feat(migrate): add terminal reporter with phased output"
```

---

### Task 7: Markdown Reporter

**Files:**
- Create: `test/migrate/reporters/markdown.test.ts`
- Create: `src/migrate/reporters/markdown.ts`

- [ ] **Step 1: Write the failing test**

Create `test/migrate/reporters/markdown.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { formatMarkdown } from '../src/migrate/reporters/markdown.js';
import { generateMigrationPlan } from '../src/migrate/index.js';
import { SAMPLE_SCAN_REPORT } from '../fixtures.js';

describe('formatMarkdown', () => {
  const plan = generateMigrationPlan(SAMPLE_SCAN_REPORT);
  const output = formatMarkdown(plan);

  it('starts with a heading', () => {
    expect(output).toMatch(/^# Migration Plan/);
  });

  it('includes a summary table', () => {
    expect(output).toContain('| Priority');
    expect(output).toContain('| Immediate');
    expect(output).toContain('| Short-term');
    expect(output).toContain('| Long-term');
  });

  it('includes phase sections as h2 headings', () => {
    expect(output).toContain('## Immediate (Critical)');
    expect(output).toContain('## Short-term (Warning)');
    expect(output).toContain('## Long-term (Info)');
  });

  it('includes step details with file references', () => {
    expect(output).toContain('`src/auth.ts:15`');
    expect(output).toContain('RSA-2048');
  });

  it('includes code blocks', () => {
    expect(output).toContain('```');
    expect(output).toContain('// Before:');
    expect(output).toContain('// After:');
  });

  it('includes dependency info', () => {
    expect(output).toContain('`@noble/post-quantum`');
  });

  it('includes rollback notes', () => {
    expect(output).toContain('> **Note:**');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/migrate/reporters/markdown.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write implementation**

Create `src/migrate/reporters/markdown.ts`:

```typescript
import type { MigrationPlan, MigrationStep } from '../types.js';

function stepToMarkdown(step: MigrationStep, index: number): string {
  const lines = [
    `### ${index + 1}. ${step.action}`,
    '',
    `- **File:** \`${step.finding.file}:${step.finding.line}\``,
    `- **Priority:** ${step.priority}`,
    `- **Effort:** ${step.effort}`,
    `- **Current:** \`${step.finding.algorithm}\``,
    '',
    '```',
    step.codeExample,
    '```',
    '',
  ];

  if (step.dependencies.length > 0) {
    lines.push(
      `**Dependencies:** ${step.dependencies.map((d) => `\`${d}\``).join(', ')}`,
      '',
    );
  }

  lines.push(`> **Note:** ${step.notes}`, '');

  return lines.join('\n');
}

export function formatMarkdown(plan: MigrationPlan): string {
  const immediate = plan.steps.filter((s) => s.priority === 'immediate');
  const shortTerm = plan.steps.filter((s) => s.priority === 'short-term');
  const longTerm = plan.steps.filter((s) => s.priority === 'long-term');

  const lines = [
    '# Migration Plan',
    '',
    `Generated: ${plan.generatedAt}`,
    '',
    `Scan: ${plan.scanReport.path} (${plan.scanReport.filesScanned} files, grade ${plan.scanReport.grade})`,
    '',
    `Changes: ${plan.estimatedEffort}`,
    '',
    '| Priority | Count |',
    '|----------|-------|',
    `| Immediate | ${plan.summary.immediate} |`,
    `| Short-term | ${plan.summary.shortTerm} |`,
    `| Long-term | ${plan.summary.longTerm} |`,
    '',
  ];

  if (immediate.length > 0) {
    lines.push('## Immediate (Critical)', '');
    let idx = 0;
    for (const step of immediate) {
      lines.push(stepToMarkdown(step, idx++));
    }
  }

  if (shortTerm.length > 0) {
    lines.push('## Short-term (Warning)', '');
    let idx = immediate.length;
    for (const step of shortTerm) {
      lines.push(stepToMarkdown(step, idx++));
    }
  }

  if (longTerm.length > 0) {
    lines.push('## Long-term (Info)', '');
    let idx = immediate.length + shortTerm.length;
    for (const step of longTerm) {
      lines.push(stepToMarkdown(step, idx++));
    }
  }

  return lines.join('\n');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/migrate/reporters/markdown.test.ts`
Expected: PASS — all 7 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/migrate/reporters/markdown.ts test/migrate/reporters/markdown.test.ts
git commit -m "feat(migrate): add markdown reporter"
```

---

### Task 8: JSON Reporter

**Files:**
- Create: `test/migrate/reporters/json.test.ts`
- Create: `src/migrate/reporters/json.ts`

- [ ] **Step 1: Write the failing test**

Create `test/migrate/reporters/json.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { formatJson } from '../src/migrate/reporters/json.js';
import { generateMigrationPlan } from '../src/migrate/index.js';
import { SAMPLE_SCAN_REPORT } from '../fixtures.js';

describe('formatJson', () => {
  const plan = generateMigrationPlan(SAMPLE_SCAN_REPORT);
  const output = formatJson(plan);

  it('produces valid JSON', () => {
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it('round-trips the plan structure', () => {
    const parsed = JSON.parse(output);
    expect(parsed.id).toBe(plan.id);
    expect(parsed.steps.length).toBe(plan.steps.length);
    expect(parsed.summary).toEqual(plan.summary);
    expect(parsed.estimatedEffort).toBe(plan.estimatedEffort);
  });

  it('is pretty-printed with 2-space indent', () => {
    expect(output).toContain('\n  ');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/migrate/reporters/json.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write implementation**

Create `src/migrate/reporters/json.ts`:

```typescript
import type { MigrationPlan } from '../types.js';

export function formatJson(plan: MigrationPlan): string {
  return JSON.stringify(plan, null, 2);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/migrate/reporters/json.test.ts`
Expected: PASS — all 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/migrate/reporters/json.ts test/migrate/reporters/json.test.ts
git commit -m "feat(migrate): add JSON reporter"
```

---

### Task 9: CLI Entry Point

**Files:**
- Create: `src/migrate/cli.ts`
- Modify: `package.json`
- Create: `test/e2e/migrate-cli.test.ts`

- [ ] **Step 1: Create CLI**

Create `src/migrate/cli.ts`:

```typescript
#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { Command } from 'commander';
import { generateMigrationPlan } from './index.js';
import { formatTerminal } from './reporters/terminal.js';
import { formatMarkdown } from './reporters/markdown.js';
import { formatJson } from './reporters/json.js';
import { createServer } from '../api/server.js';
import type { ScanReport } from './types.js';

const program = new Command()
  .name('qcrypt-migrate')
  .description('Generate post-quantum migration guides from scan results')
  .argument('[path]', 'path to scan for vulnerabilities')
  .option('--scan-file <file>', 'use existing scan results JSON file')
  .option('--json', 'output as JSON')
  .option('--markdown', 'output as markdown (writes migration-plan.md)')
  .option('--serve', 'start web UI server')
  .option('--port <n>', 'server port', '3200');

program.parse();

const opts = program.opts();
const targetPath = program.args[0];

async function main() {
  if (opts.serve) {
    const port = parseInt(opts.port, 10);
    const app = createServer();
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`qcrypt-migrate server running on http://localhost:${port}`);
    return;
  }

  let scanReport: ScanReport;

  if (opts.scanFile) {
    const content = readFileSync(opts.scanFile, 'utf-8');
    scanReport = JSON.parse(content) as ScanReport;
  } else if (targetPath) {
    const { runScan } = await import('./scan-runner.js');
    scanReport = await runScan(targetPath);
  } else {
    console.error('Error: provide a path to scan or --scan-file with existing results');
    process.exit(2);
  }

  const plan = generateMigrationPlan(scanReport);

  if (opts.json) {
    console.log(formatJson(plan));
  } else if (opts.markdown) {
    const content = formatMarkdown(plan);
    writeFileSync('migration-plan.md', content);
    console.log('Migration plan written to migration-plan.md');
  } else {
    console.log(formatTerminal(plan));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
```

- [ ] **Step 2: Update package.json**

Add `qcrypt-migrate` to the `bin` field in `package.json`:

```json
"bin": {
  "qcrypt-bench": "dist/cli.js",
  "qcrypt-migrate": "dist/migrate/cli.js"
},
```

- [ ] **Step 3: Write E2E test**

Create `test/e2e/migrate-cli.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';

const CLI = 'npx tsx src/migrate/cli.ts';
const FIXTURE = 'test/migrate/fixtures/sample-scan.json';

describe('E2E: qcrypt-migrate CLI', () => {
  it('produces terminal output from --scan-file', () => {
    const output = execSync(`${CLI} --scan-file ${FIXTURE}`, {
      encoding: 'utf-8',
      timeout: 15000,
    });
    expect(output).toContain('qcrypt-migrate');
    expect(output).toContain('Migration Guide');
    expect(output).toContain('RSA-2048');
  });

  it('produces valid JSON with --scan-file --json', () => {
    const output = execSync(`${CLI} --scan-file ${FIXTURE} --json`, {
      encoding: 'utf-8',
      timeout: 15000,
    });
    const parsed = JSON.parse(output);
    expect(parsed.id).toBeTruthy();
    expect(parsed.steps.length).toBeGreaterThan(0);
    expect(parsed.summary.immediate).toBeGreaterThanOrEqual(0);
  });

  it('writes markdown file with --scan-file --markdown', () => {
    const tmpDir = execSync('mktemp -d', { encoding: 'utf-8' }).trim();
    execSync(`${CLI} --scan-file ${FIXTURE} --markdown`, {
      encoding: 'utf-8',
      timeout: 15000,
      cwd: tmpDir,
    });
    const content = execSync(`cat ${tmpDir}/migration-plan.md`, { encoding: 'utf-8' });
    expect(content).toContain('# Migration Plan');
    expect(content).toContain('RSA-2048');
    execSync(`rm -rf ${tmpDir}`);
  });

  it('exits with error when no path or --scan-file given', () => {
    expect(() => {
      execSync(`${CLI}`, { encoding: 'utf-8', timeout: 15000 });
    }).toThrow();
  });
});
```

- [ ] **Step 4: Run E2E test**

Run: `npx vitest run test/e2e/migrate-cli.test.ts`
Expected: PASS — all 4 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/migrate/cli.ts test/e2e/migrate-cli.test.ts package.json
git commit -m "feat(migrate): add CLI entry point with scan-file, json, and markdown modes"
```

---

### Task 10: Scan Integration

**Files:**
- Modify: `package.json` (add qcrypt-scan dependency)
- Create: `src/migrate/scan-runner.ts`

- [ ] **Step 1: Build qcrypt-scan and add as dependency**

```bash
cd /Users/varma/qcrypt-scan && npm run build
cd /Users/varma/qcrypt-bench
```

Add `qcrypt-scan` to `dependencies` in `package.json`:

```json
"dependencies": {
  "@fastify/static": "^9.0.0",
  "chalk": "^5.6.2",
  "commander": "^14.0.3",
  "fastify": "^5.8.4",
  "qcrypt-scan": "file:../qcrypt-scan"
},
```

```bash
npm install
```

Verify: `ls node_modules/qcrypt-scan/dist/index.js` should exist.

**If `file:` dependency fails** (missing dist, type resolution issues), fall back to this alternative `scan-runner.ts` that shells out to the CLI:

```typescript
// Fallback scan-runner.ts — only use if file: dependency doesn't work
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ScanReport } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCAN_CLI = path.resolve(__dirname, '../../../qcrypt-scan/src/cli.ts');

export async function runScan(targetPath: string): Promise<ScanReport> {
  const output = execSync(`npx tsx "${SCAN_CLI}" "${targetPath}" --json`, {
    encoding: 'utf-8',
    timeout: 120000,
  });
  return JSON.parse(output) as ScanReport;
}
```

- [ ] **Step 2: Create scan-runner.ts (primary: direct import)**

Create `src/migrate/scan-runner.ts`:

```typescript
import { scan } from 'qcrypt-scan';
import type { ScanReport } from './types.js';

export async function runScan(targetPath: string): Promise<ScanReport> {
  return (await scan(targetPath)) as ScanReport;
}
```

- [ ] **Step 3: Verify scan integration works**

```bash
npx tsx -e "import { runScan } from './src/migrate/scan-runner.js'; runScan('.').then(r => console.log('Scanned', r.filesScanned, 'files, grade:', r.grade))"
```

Expected: prints scanned file count and grade for the current directory.

- [ ] **Step 4: Test full CLI with path argument**

```bash
npx tsx src/migrate/cli.ts . --json | head -20
```

Expected: JSON output with migration plan for the current directory.

- [ ] **Step 5: Commit**

```bash
git add src/migrate/scan-runner.ts package.json package-lock.json
git commit -m "feat(migrate): add scan integration via qcrypt-scan dependency"
```

---

### Task 11: API Endpoints

**Files:**
- Modify: `src/api/server.ts`
- Create: `test/e2e/migrate-api.test.ts`

- [ ] **Step 1: Add migrate routes to server**

Modify `src/api/server.ts`. Add these imports at the top:

```typescript
import { generateMigrationPlan } from '../migrate/index.js';
import type { MigrationPlan, ScanReport } from '../migrate/types.js';
```

Add these routes inside `createServer()`, after the existing `app.get('/api/reference', ...)` route and before the static file serving block:

```typescript
  // ── Migrate routes ──

  const migrateHistory: MigrationPlan[] = [];

  app.post<{ Body: { path?: string; scanReport?: ScanReport } }>(
    '/api/migrate',
    async (request) => {
      let scanReport = request.body?.scanReport;

      if (!scanReport && request.body?.path) {
        const { runScan } = await import('../migrate/scan-runner.js');
        scanReport = await runScan(request.body.path);
      }

      if (!scanReport) {
        const { runScan } = await import('../migrate/scan-runner.js');
        scanReport = await runScan('.');
      }

      const plan = generateMigrationPlan(scanReport);
      migrateHistory.unshift(plan);
      return plan;
    },
  );

  app.get('/api/migrate/history', async () => migrateHistory);

  app.get<{ Params: { id: string } }>('/api/migrate/:id', async (request, reply) => {
    const plan = migrateHistory.find((p) => p.id === request.params.id);
    if (!plan) {
      reply.code(404);
      return { error: 'Not found' };
    }
    return plan;
  });
```

- [ ] **Step 2: Write E2E API test**

Create `test/e2e/migrate-api.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createServer } from '../src/api/server.js';
import { SAMPLE_SCAN_REPORT } from '../migrate/fixtures.js';

describe('E2E: Migrate API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = createServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/migrate with scanReport returns migration plan', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/migrate',
      payload: { scanReport: SAMPLE_SCAN_REPORT },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.id).toBeTruthy();
    expect(body.steps.length).toBeGreaterThan(0);
    expect(body.summary.immediate).toBeGreaterThanOrEqual(0);
    expect(body.scanReport.id).toBe(SAMPLE_SCAN_REPORT.id);
  });

  it('GET /api/migrate/history returns past plans', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/migrate/history',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.length).toBeGreaterThan(0);
  });

  it('GET /api/migrate/:id returns a specific plan', async () => {
    // First create a plan
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/migrate',
      payload: { scanReport: SAMPLE_SCAN_REPORT },
    });
    const planId = createRes.json().id;

    const res = await app.inject({
      method: 'GET',
      url: `/api/migrate/${planId}`,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe(planId);
  });

  it('GET /api/migrate/:id returns 404 for unknown id', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/migrate/nonexistent',
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().error).toBe('Not found');
  });
});
```

- [ ] **Step 3: Run E2E API test**

Run: `npx vitest run test/e2e/migrate-api.test.ts`
Expected: PASS — all 4 tests pass

- [ ] **Step 4: Run full test suite to verify nothing is broken**

Run: `npx vitest run`
Expected: All existing tests + all new migrate tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/api/server.ts test/e2e/migrate-api.test.ts
git commit -m "feat(migrate): add API endpoints for migration plan generation"
```

---

### Task 12: Web UI — Migrate Page

**Files:**
- Modify: `web/src/api.ts`
- Modify: `web/src/components/Sidebar.tsx`
- Modify: `web/src/App.tsx`
- Create: `web/src/pages/Migrate.tsx`

- [ ] **Step 1: Add types and API functions to web/src/api.ts**

Add these types and functions at the end of `web/src/api.ts`:

```typescript
// ── Migrate types ──

export interface MigrateFinding {
  file: string;
  line: number;
  algorithm: string;
  category: string;
  risk: string;
  snippet: string;
  explanation: string;
  replacement: string;
}

export interface MigrationStep {
  finding: MigrateFinding;
  priority: 'immediate' | 'short-term' | 'long-term';
  action: string;
  codeExample: string;
  dependencies: string[];
  effort: 'low' | 'medium' | 'high';
  notes: string;
}

export interface MigrationPlan {
  id: string;
  generatedAt: string;
  scanReport: {
    id: string;
    path: string;
    scannedAt: string;
    filesScanned: number;
    findings: MigrateFinding[];
    summary: { critical: number; warning: number; info: number; ok: number };
    grade: string;
  };
  steps: MigrationStep[];
  summary: { immediate: number; shortTerm: number; longTerm: number };
  estimatedEffort: string;
}

// ── Migrate API ──

export function generateMigratePlan(
  path?: string,
  scanReport?: MigrationPlan['scanReport'],
): Promise<MigrationPlan> {
  return fetchJson('/api/migrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, scanReport }),
  });
}

export function getMigrateHistory(): Promise<MigrationPlan[]> {
  return fetchJson('/api/migrate/history');
}

export function getMigratePlan(id: string): Promise<MigrationPlan> {
  return fetchJson(`/api/migrate/${id}`);
}
```

- [ ] **Step 2: Add Migrate to Sidebar and Router**

Modify `web/src/components/Sidebar.tsx` — add the Migrate link to the `links` array:

```typescript
const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/comparison', label: 'Comparison' },
  { to: '/education', label: 'Education' },
  { to: '/migrate', label: 'Migrate' },
];
```

Modify `web/src/App.tsx` — add import and route:

```typescript
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Comparison from './pages/Comparison.tsx';
import Education from './pages/Education.tsx';
import Migrate from './pages/Migrate.tsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/comparison" element={<Comparison />} />
        <Route path="/education" element={<Education />} />
        <Route path="/migrate" element={<Migrate />} />
      </Route>
    </Routes>
  );
}
```

- [ ] **Step 3: Create Migrate page**

Create `web/src/pages/Migrate.tsx`:

```tsx
import { useState } from 'react';
import { generateMigratePlan, type MigrationPlan, type MigrationStep } from '../api.ts';

const PRIORITY_STYLES: Record<string, string> = {
  immediate: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
  'short-term': 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
  'long-term': 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
};

const EFFORT_STYLES: Record<string, string> = {
  low: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
  medium: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
  high: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
};

function StepCard({ step }: { step: MigrationStep }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-slate-200 dark:border-[#333] rounded-lg p-4 mb-3">
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_STYLES[step.priority]}`}>
            {step.priority}
          </span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${EFFORT_STYLES[step.effort]}`}>
            {step.effort}
          </span>
          <span className="font-medium text-sm">{step.action}</span>
          <span className="ml-auto text-slate-400 text-xs">{expanded ? '\u25BC' : '\u25B6'}</span>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {step.finding.file}:{step.finding.line}
        </div>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Current Code</div>
            <pre className="bg-slate-100 dark:bg-[#111] p-2 rounded text-xs overflow-x-auto">
              {step.finding.snippet}
            </pre>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Migration Example</div>
            <pre className="bg-slate-100 dark:bg-[#111] p-2 rounded text-xs overflow-x-auto">
              {step.codeExample}
            </pre>
          </div>
          {step.dependencies.length > 0 && (
            <div className="text-xs">
              <span className="font-medium text-slate-500 dark:text-slate-400">Dependencies: </span>
              {step.dependencies.map((d) => (
                <code key={d} className="bg-slate-100 dark:bg-[#111] px-1 rounded mr-1">{d}</code>
              ))}
            </div>
          )}
          <div className="text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Note: </span>{step.notes}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Migrate() {
  const [scanPath, setScanPath] = useState('.');
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [running, setRunning] = useState(false);
  const [plan, setPlan] = useState<MigrationPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setRunning(true);
    setError(null);
    try {
      if (scanFile) {
        const text = await scanFile.text();
        const scanReport = JSON.parse(text);
        const result = await generateMigratePlan(undefined, scanReport);
        setPlan(result);
      } else {
        const result = await generateMigratePlan(scanPath);
        setPlan(result);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate migration plan');
    } finally {
      setRunning(false);
    }
  };

  const handleDownload = () => {
    if (!plan) return;
    const lines = [
      '# Migration Plan\n\n',
      `Generated: ${plan.generatedAt}\n\n`,
      `Changes: ${plan.estimatedEffort}\n\n`,
    ];
    for (const step of plan.steps) {
      lines.push(`## ${step.action}\n\n`);
      lines.push(`- **File:** ${step.finding.file}:${step.finding.line}\n`);
      lines.push(`- **Priority:** ${step.priority} | **Effort:** ${step.effort}\n\n`);
      lines.push(`\`\`\`\n${step.codeExample}\n\`\`\`\n\n`);
      if (step.dependencies.length > 0) {
        lines.push(`**Dependencies:** ${step.dependencies.join(', ')}\n\n`);
      }
      lines.push(`> ${step.notes}\n\n`);
    }
    const blob = new Blob([lines.join('')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'migration-plan.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const immediate = plan?.steps.filter((s) => s.priority === 'immediate') ?? [];
  const shortTerm = plan?.steps.filter((s) => s.priority === 'short-term') ?? [];
  const longTerm = plan?.steps.filter((s) => s.priority === 'long-term') ?? [];

  return (
    <div className="max-w-5xl">
      <h2 className="text-2xl font-bold mb-6">Migration Guide</h2>

      <div className="flex items-end gap-4 mb-8 flex-wrap">
        <div>
          <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Path to scan</label>
          <input
            type="text"
            value={scanPath}
            onChange={(e) => setScanPath(e.target.value)}
            className="px-3 py-1.5 rounded border border-slate-300 dark:border-[#333] bg-white dark:bg-[#111] text-sm w-64"
            placeholder="."
          />
        </div>

        <div>
          <label className="block text-sm text-slate-500 dark:text-slate-400 mb-1">Or upload scan JSON</label>
          <input
            type="file"
            accept=".json"
            onChange={(e) => setScanFile(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={running}
          className="px-4 py-1.5 rounded bg-accent text-black font-medium text-sm hover:bg-accent/80 disabled:opacity-50 transition-colors"
        >
          {running ? 'Generating...' : 'Generate Plan'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {plan && (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex gap-4 text-sm">
              <span className="text-red-600 dark:text-red-400 font-medium">
                Immediate: {plan.summary.immediate}
              </span>
              <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                Short-term: {plan.summary.shortTerm}
              </span>
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                Long-term: {plan.summary.longTerm}
              </span>
            </div>
            <button
              onClick={handleDownload}
              className="px-3 py-1 rounded border border-slate-300 dark:border-[#333] text-sm hover:bg-slate-100 dark:hover:bg-[#1a1a1a] transition-colors"
            >
              Download as Markdown
            </button>
          </div>

          <div className="text-sm text-slate-500 dark:text-slate-400">
            {plan.estimatedEffort} &mdash; Grade: {plan.scanReport.grade}
          </div>

          {immediate.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-3">Immediate</h3>
              {immediate.map((step, i) => (
                <StepCard key={`imm-${i}`} step={step} />
              ))}
            </div>
          )}

          {shortTerm.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-yellow-600 dark:text-yellow-400 mb-3">Short-term</h3>
              {shortTerm.map((step, i) => (
                <StepCard key={`st-${i}`} step={step} />
              ))}
            </div>
          )}

          {longTerm.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-3">Long-term</h3>
              {longTerm.map((step, i) => (
                <StepCard key={`lt-${i}`} step={step} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Build and verify web UI**

```bash
cd web && npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add web/src/api.ts web/src/components/Sidebar.tsx web/src/App.tsx web/src/pages/Migrate.tsx
git commit -m "feat(migrate): add Migrate page to web UI with expandable step cards"
```

---

## Task Dependency Map

```
Task 1 (Types + Fixtures)
├── Task 2 (Dependencies)
│   └── Task 3 (Code Examples)
│       └── Task 4 (Step Generator)
│           └── Task 5 (Orchestrator)
│               ├── Task 6 (Terminal Reporter) ─┐
│               ├── Task 7 (Markdown Reporter) ─┼── Task 9 (CLI)
│               ├── Task 8 (JSON Reporter) ─────┘
│               ├── Task 10 (Scan Integration) ── Task 9 (CLI path mode)
│               └── Task 11 (API Endpoints)
│                   └── Task 12 (Web UI)
```

**Parallelizable groups:**
- After Task 5: Tasks 6, 7, 8 can run in parallel
- After Tasks 6-8: Task 9 can proceed
- After Task 5: Tasks 10, 11 can run in parallel with reporters

## Final Verification

After all tasks complete:

```bash
npx vitest run                    # all tests pass
npx tsx src/migrate/cli.ts --scan-file test/migrate/fixtures/sample-scan.json
npx tsx src/migrate/cli.ts --scan-file test/migrate/fixtures/sample-scan.json --json
npx tsx src/migrate/cli.ts --scan-file test/migrate/fixtures/sample-scan.json --markdown
cd web && npm run build           # web UI builds cleanly
```
