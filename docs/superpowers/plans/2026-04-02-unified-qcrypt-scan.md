# Unified qcrypt-scan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge all qcrypt-bench features into qcrypt-scan with the Quantum Sentry matrix-themed web UI.

**Architecture:** Keep qcrypt-scan's advanced scanner as the foundation. Port benchmarks, migration planner, CI, compliance, DB, HTML reports, and GitHub scanning from qcrypt-bench. Adapt all imports to use unified types. Rebuild the web UI with the forensic terminal Quantum Sentry theme.

**Tech Stack:** TypeScript, Node.js, React 19, Vite, Tailwind CSS, Fastify, Commander, better-sqlite3, chalk

---

### Task 1: Add Dependencies & Merge Types

**Files:**
- Modify: `package.json`
- Modify: `src/types.ts`

- [ ] **Step 1: Add better-sqlite3 dependency**

```bash
cd /Users/varma/qcrypt-scan && npm install better-sqlite3 && npm install -D @types/better-sqlite3
```

- [ ] **Step 2: Merge types - add benchmark and migration types to src/types.ts**

Append to the existing `src/types.ts`:

```typescript
// ── Benchmark types ──

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
  platform: { os: string; arch: string; node: string; cpuModel: string };
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

// ── Migration types ──

export type Priority = 'immediate' | 'short-term' | 'long-term';
export type Effort = 'low' | 'medium' | 'high';

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

- [ ] **Step 3: Run tsc to verify types compile**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Run existing tests to verify nothing broke**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/types.ts
git commit -m "feat: add benchmark and migration types, add better-sqlite3 dep"
```

---

### Task 2: Port Benchmark Module

**Files:**
- Create: `src/benchmarks/runner.ts`
- Create: `src/benchmarks/keygen.ts`
- Create: `src/benchmarks/sign-verify.ts`
- Create: `src/benchmarks/encrypt-decrypt.ts`
- Create: `src/benchmarks/hash.ts`
- Create: `src/benchmarks/index.ts`
- Create: `src/reference/pqc-data.ts`
- Create: `src/education/comparisons.ts`
- Test: `test/benchmarks/index.test.ts`

- [ ] **Step 1: Create benchmarks/runner.ts**

```typescript
// src/benchmarks/runner.ts
import { performance } from 'node:perf_hooks';

export interface TimingResult {
  opsPerSecond: number;
  avgTimeMs: number;
}

const WARMUP_ITERATIONS = 10;

export function benchmark(fn: () => void, iterations: number): TimingResult {
  for (let i = 0; i < WARMUP_ITERATIONS; i++) fn();

  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  const elapsed = performance.now() - start;

  return {
    opsPerSecond: Math.round((iterations / elapsed) * 1000),
    avgTimeMs: Number((elapsed / iterations).toFixed(4)),
  };
}
```

- [ ] **Step 2: Create benchmarks/keygen.ts**

Copy from `/Users/varma/qcrypt-bench/src/benchmarks/keygen.ts`, change import path:
`import type { BenchmarkResult } from '../types.js';`

- [ ] **Step 3: Create benchmarks/sign-verify.ts**

Copy from `/Users/varma/qcrypt-bench/src/benchmarks/sign-verify.ts`, change import path:
`import type { BenchmarkResult } from '../types.js';`

- [ ] **Step 4: Create benchmarks/encrypt-decrypt.ts**

Copy from `/Users/varma/qcrypt-bench/src/benchmarks/encrypt-decrypt.ts`, change import path:
`import type { BenchmarkResult } from '../types.js';`

- [ ] **Step 5: Create benchmarks/hash.ts**

Copy from `/Users/varma/qcrypt-bench/src/benchmarks/hash.ts`, change import path:
`import type { BenchmarkResult } from '../types.js';`

- [ ] **Step 6: Create reference/pqc-data.ts**

Copy from `/Users/varma/qcrypt-bench/src/reference/pqc-data.ts`, change import:
`import type { BenchmarkResult, AlgorithmProfile } from '../types.js';`

- [ ] **Step 7: Create education/comparisons.ts**

Copy from `/Users/varma/qcrypt-bench/src/education/comparisons.ts`, change import:
`import type { Comparison } from '../types.js';`

- [ ] **Step 8: Create benchmarks/index.ts**

Copy from `/Users/varma/qcrypt-bench/src/index.ts` (the benchmark orchestrator), rename exports, change imports to use local paths.

- [ ] **Step 9: Write test**

```typescript
// test/benchmarks/index.test.ts
import { describe, it, expect } from 'vitest';
import { runBenchmarks } from '../../src/benchmarks/index.js';

describe('benchmarks', () => {
  it('runs hash benchmarks with low iterations', () => {
    const report = runBenchmarks({ iterations: 10, category: 'hash' });
    expect(report.results.length).toBeGreaterThan(0);
    expect(report.results[0].operation).toBe('hash');
  });

  it('includes PQC reference data for kex category', () => {
    const report = runBenchmarks({ iterations: 10, category: 'kex' });
    const refs = report.results.filter((r) => r.isReference);
    expect(refs.length).toBeGreaterThan(0);
  });

  it('includes comparisons', () => {
    const report = runBenchmarks({ iterations: 10, category: 'all' });
    expect(report.comparisons.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 10: Run tests**

```bash
npm test
```

- [ ] **Step 11: Commit**

```bash
git add src/benchmarks/ src/reference/ src/education/comparisons.ts test/benchmarks/
git commit -m "feat: port benchmark module with PQC reference data"
```

---

### Task 3: Port Migration Planner

**Files:**
- Create: `src/migrate/index.ts`
- Create: `src/migrate/steps/generator.ts`
- Create: `src/migrate/steps/code-examples.ts`
- Create: `src/migrate/steps/dependencies.ts`
- Create: `src/migrate/reporters/terminal.ts`
- Create: `src/migrate/reporters/markdown.ts`
- Create: `src/migrate/reporters/json.ts`
- Test: `test/migrate/index.test.ts`

- [ ] **Step 1: Create migrate/steps/dependencies.ts**

Copy from qcrypt-bench, change import:
`import type { AlgorithmCategory } from '../../types.js';`

- [ ] **Step 2: Create migrate/steps/code-examples.ts**

Copy from qcrypt-bench, update import of `detectLanguage`.

- [ ] **Step 3: Create migrate/steps/generator.ts**

Copy from qcrypt-bench, change imports to:
```typescript
import type { Finding, MigrationStep, Priority, Effort, RiskLevel } from '../../types.js';
```

- [ ] **Step 4: Create migrate/index.ts**

```typescript
import { randomUUID } from 'node:crypto';
import type { ScanReport, MigrationPlan, MigrationStep } from '../types.js';
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

- [ ] **Step 5: Create migrate reporters (terminal, markdown, json)**

Copy from qcrypt-bench, change imports to use `../../types.js`.

- [ ] **Step 6: Write test**

```typescript
// test/migrate/index.test.ts
import { describe, it, expect } from 'vitest';
import { generateMigrationPlan } from '../../src/migrate/index.js';
import type { ScanReport } from '../../src/types.js';

describe('migration planner', () => {
  it('generates steps from scan findings', () => {
    const report: ScanReport = {
      id: 'test', path: '.', scannedAt: new Date().toISOString(),
      filesScanned: 1, findings: [
        { file: 'test.js', line: 1, algorithm: 'RSA', category: 'asymmetric',
          risk: 'CRITICAL', snippet: 'rsa.gen()', explanation: 'Quantum vulnerable', replacement: 'ML-KEM' },
      ],
      enrichedFindings: [], summary: { critical: 1, warning: 0, info: 0, ok: 0 },
      grade: 'F', readiness: { overall: 0, dimensions: {
        vulnerability: { score: 0, weighted: 0, details: '' },
        priority: { score: 0, weighted: 0, details: '' },
        migration: { score: 0, weighted: 0, details: '' },
        agility: { score: 0, weighted: 0, details: '' },
      }},
    };
    const plan = generateMigrationPlan(report);
    expect(plan.steps.length).toBe(1);
    expect(plan.steps[0].priority).toBe('immediate');
  });
});
```

- [ ] **Step 7: Run tests**

```bash
npm test
```

- [ ] **Step 8: Commit**

```bash
git add src/migrate/ test/migrate/
git commit -m "feat: port migration planner with code examples"
```

---

### Task 4: Port CI, Compliance, DB, GitHub Scanner, HTML Reports

**Files:**
- Create: `src/ci/` (index.ts, detect.ts, init.ts, exit.ts, annotations.ts, sarif.ts, summary.ts)
- Create: `src/compliance/` (index.ts, frameworks.ts, assess.ts)
- Create: `src/db/` (index.ts, projects.ts, scans.ts)
- Create: `src/github/scanner.ts`
- Create: `src/report/` (index.ts, html.ts)
- Test: `test/ci/index.test.ts`, `test/compliance/assess.test.ts`, `test/github/scanner.test.ts`

- [ ] **Step 1: Port compliance module**

Copy frameworks.ts and assess.ts from qcrypt-bench. Adapt imports to use `../types.js` instead of `../migrate/types.js`. Create index.ts barrel.

- [ ] **Step 2: Port CI module**

Copy all CI files from qcrypt-bench. Adapt imports:
- `annotations.ts`: import Finding/RiskLevel from `../types.js`
- `sarif.ts`: import from `../types.js`
- `summary.ts`: import from `../types.js` and `../compliance/index.js`
- `index.ts`: import from local files + `../compliance/index.js`

Adapt `runCI` to use qcrypt-scan's `scan()` function directly (with GitHub URL support via the github scanner).

- [ ] **Step 3: Port DB module**

Copy db/index.ts, db/projects.ts, db/scans.ts from qcrypt-bench. Adapt imports to use `../types.js`.

- [ ] **Step 4: Port GitHub scanner**

Create `src/github/scanner.ts` adapted from qcrypt-bench's `scanner/github.ts`. Key change: use qcrypt-scan's scanners and enrichment pipeline instead of the simpler bench scanner. Import from `../scanners/`, `../rules/`, `../analyzers/`, `../types.js`.

- [ ] **Step 5: Port HTML report generator**

Copy report/html.ts from qcrypt-bench. Adapt imports to use `../types.js` and `../compliance/index.js`.

- [ ] **Step 6: Update scan entry point to support GitHub URLs**

Modify `src/index.ts` to detect GitHub URLs and delegate to the GitHub scanner.

- [ ] **Step 7: Write tests for compliance and CI**

- [ ] **Step 8: Run all tests**

```bash
npm test
```

- [ ] **Step 9: Commit**

```bash
git add src/ci/ src/compliance/ src/db/ src/github/ src/report/ test/
git commit -m "feat: port CI, compliance, DB, GitHub scanner, HTML reports"
```

---

### Task 5: Merge CLI with Subcommands

**Files:**
- Modify: `src/cli.ts`

- [ ] **Step 1: Rewrite CLI with subcommands**

Keep scan as default action. Add `bench`, `migrate`, `ci init` subcommands. Add `--serve` global option.

- [ ] **Step 2: Run CLI smoke tests**

```bash
npx tsx src/cli.ts --help
npx tsx src/cli.ts bench --help
npx tsx src/cli.ts migrate --help
```

- [ ] **Step 3: Commit**

```bash
git add src/cli.ts
git commit -m "feat: unified CLI with bench, migrate, ci subcommands"
```

---

### Task 6: Merge API Server

**Files:**
- Modify: `src/api/server.ts`

- [ ] **Step 1: Merge all endpoints from qcrypt-bench**

Add: bench, migrate, browse, projects, scans (DB-backed), compliance, reports endpoints. Keep existing scan endpoints. Add GitHub URL support to POST /api/scan.

- [ ] **Step 2: Run API smoke test**

```bash
npx tsx src/api/server.ts &
curl http://localhost:3000/api/health
```

- [ ] **Step 3: Commit**

```bash
git add src/api/server.ts
git commit -m "feat: unified API server with all endpoints"
```

---

### Task 7: Quantum Sentry Web UI - Foundation & Layout

**Files:**
- Modify: `web/package.json`
- Modify: `web/tailwind.config.ts`
- Create: `web/src/theme.ts`
- Modify: `web/src/App.tsx`
- Rewrite: `web/src/components/Layout.tsx`
- Rewrite: `web/src/components/Sidebar.tsx`
- Create: `web/src/components/TopNav.tsx`
- Modify: `web/src/api.ts`

- [ ] **Step 1: Update tailwind config with Quantum Sentry theme**

Full color palette from the DESIGN.md: void (#131318), neon green (#39FF14), obsidian surface layers, Space Grotesk + JetBrains Mono fonts, 0px border radius.

- [ ] **Step 2: Create theme.ts constants**

- [ ] **Step 3: Build Layout with Sidebar + TopNav**

Matrix-themed sidebar with QC-SENTRY branding, nav items (Dashboard, Scans, Benchmarks, Migration, Compliance, Projects), NEW SCAN button. TopNav with system status, notifications.

- [ ] **Step 4: Update API client with all new endpoints**

- [ ] **Step 5: Update App.tsx with new routes**

- [ ] **Step 6: Commit**

```bash
cd web && git add . && cd .. && git commit -m "feat: Quantum Sentry theme foundation and layout"
```

---

### Task 8: Dashboard Page

**Files:**
- Rewrite: `web/src/pages/Dashboard.tsx`
- Create: `web/src/components/StatsCard.tsx`
- Create: `web/src/components/ScanInput.tsx`
- Create: `web/src/components/RecentScans.tsx`
- Create: `web/src/components/ForensicFeed.tsx`

- [ ] **Step 1: Build Dashboard**

"INITIATE QUANTUM AUDIT" hero section. GitHub URL input field. Local directory picker (folder icon, uses /api/browse). Drag & drop zone for files. Stats cards (Global Threat Level, Engines Active, Ecosystem Health). Recent Intelligence grid with project cards. Live Forensic Feed terminal log at bottom.

- [ ] **Step 2: Commit**

---

### Task 9: Scan Results Page

**Files:**
- Rewrite: `web/src/pages/ScanResults.tsx`
- Create: `web/src/components/FindingCard.tsx` (rewrite)
- Create: `web/src/components/ThreatGauge.tsx`
- Create: `web/src/components/MigrationTopology.tsx`
- Create: `web/src/components/ComplianceCard.tsx`

- [ ] **Step 1: Build Scan Results**

Header with project name, threat level gauge. Stats grid (Critical/Warning/Info). Finding cards with severity badges, QUANTUM THREAT tag, code snippets, tags. Post-Quantum Remediation Plan section with migration path topology (RSA -> HYBRID -> KYBER visual). Compliance status section.

- [ ] **Step 2: Commit**

---

### Task 10: Benchmarks, Migration, Compliance, Projects Pages

**Files:**
- Create: `web/src/pages/Benchmarks.tsx`
- Create: `web/src/pages/Migration.tsx`
- Create: `web/src/pages/Compliance.tsx`
- Create: `web/src/pages/Projects.tsx`
- Create: `web/src/pages/ScanProgress.tsx`

- [ ] **Step 1: Build Benchmarks page**

Category selector, iteration count input, "RUN BENCHMARK" button. Results table with algorithm, operation, ops/sec, avg time, quantum-safe badge. PQC reference data comparison section.

- [ ] **Step 2: Build Migration page**

Priority-grouped migration steps. Each step: file:line, effort badge, code example (before/after), dependencies. Summary header with immediate/short-term/long-term counts.

- [ ] **Step 3: Build Compliance page**

Framework cards for CNSA 2.0, FIPS 140-3, SP 800-208, PCI DSS 4.0. Each card: status badge, non-compliant count, deprecated count, deadline. Drill-down into violations.

- [ ] **Step 4: Build Projects page**

Multi-project overview. Project cards with latest grade, scan date, critical count. Click to view scan history. Add project / re-scan buttons.

- [ ] **Step 5: Build Scan Progress page**

Circular gauge (SVG) showing scan progress. Threat metrics sidebar. Real-time forensic log stream at bottom. Abort button.

- [ ] **Step 6: Commit**

---

### Task 11: Final Integration & Testing

- [ ] **Step 1: Build web UI**

```bash
cd web && npm run build
```

- [ ] **Step 2: Run full test suite**

```bash
npm test
```

- [ ] **Step 3: E2E smoke test**

```bash
npx tsx src/cli.ts .
npx tsx src/cli.ts bench --category hash --iterations 10
npx tsx src/cli.ts --serve --port 3100
```

- [ ] **Step 4: Final commit**

```bash
git add -A && git commit -m "feat: complete unified qcrypt-scan with Quantum Sentry UI"
```
