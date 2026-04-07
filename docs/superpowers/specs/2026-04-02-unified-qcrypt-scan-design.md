# Unified qcrypt-scan Design Spec

## Goal
Merge all qcrypt-bench features into qcrypt-scan, keeping qcrypt-scan's advanced scanner (readiness scoring, analyzers, CBOM, SARIF, config) while porting benchmarks, migration planner, CI integration, compliance assessment, SQLite persistence, HTML reports, and GitHub scanning. Rebuild the web UI with the Quantum Sentry matrix theme.

## Architecture

**Single CLI binary** (`qcrypt-scan`) with scan as default action, subcommands for bench/migrate/ci.

### Backend Modules (src/)
- `scanners/`, `rules/`, `analyzers/`, `config/`, `education/` — KEEP from qcrypt-scan
- `reporters/` — KEEP existing (terminal, json, sarif, cbom)
- `benchmarks/` — PORT from qcrypt-bench (runner, keygen, sign-verify, encrypt-decrypt, hash)
- `migrate/` — PORT from qcrypt-bench (planner, steps, code-examples, dependencies, reporters)
- `ci/` — PORT from qcrypt-bench (detect, init, exit, annotations, sarif, summary)
- `compliance/` — PORT from qcrypt-bench (frameworks, assess)
- `db/` — PORT from qcrypt-bench (SQLite persistence)
- `github/` — PORT scanner from qcrypt-bench, adapted to use qcrypt-scan's enriched scanner
- `reference/` — PORT from qcrypt-bench (PQC data)
- `report/` — PORT from qcrypt-bench (HTML report generator)
- `types.ts` — MERGE both type systems
- `cli.ts` — MERGE with subcommands
- `api/server.ts` — MERGE all endpoints

### Web UI (Quantum Sentry Theme)
Pages: Dashboard, Scan Progress, Scan Results, Benchmarks, Migration, Compliance, Projects

### Type Adaptation
qcrypt-bench modules import `Finding` and `ScanReport` from `migrate/types.ts`. These are compatible with qcrypt-scan's types. The merged codebase will:
- Keep qcrypt-scan's richer `ScanReport` (with `enrichedFindings`, `readiness`)
- Export a `Finding` type compatible with both
- Adapt migrate/ci/compliance to import from the unified `types.ts`

### New Dependency
- `better-sqlite3` for project/scan persistence
