# qcrypt-migrate — Handoff Document

Start a new session with: **"let's build qcrypt-migrate"** and I'll pick up right where we left off.

## What exists

**Repo:** https://github.com/varmabudharaju/qcrypt (renamed from qcrypt-scan)
**Branch:** `master` (synced with remote `main`)
**Working directory:** `/Users/varma/qcrypt-bench`

### qcrypt-bench (tool 2 — complete)
- 66 tests passing across 13 test files
- CLI: `npx tsx src/cli.ts` with `--iterations`, `--category`, `--json`, `--serve`
- API: Fastify on port 3200 with bench, history, reference endpoints
- Web UI: React + Vite + Tailwind with Dashboard, Comparison, Education pages
- All classical crypto benchmarks + NIST PQC reference data + 5 educational comparisons

### qcrypt-scan (tool 1 — separate repo)
- Lives at `/Users/varma/qcrypt-scan`
- Scans codebases for quantum-vulnerable crypto
- Produces `ScanReport` with `Finding[]` (algorithm, file, line, snippet, risk, replacement guidance)
- Supports JS/TS, Python, Go, Rust, Java/Kotlin + certificates, configs, dependencies

## What to build next

**qcrypt-migrate (tool 3)** — Migration guide generator

### Design spec (approved)
`docs/superpowers/specs/2026-03-27-qcrypt-migrate-design.md`

### Key decisions already made
1. **Migration guide generator** — does NOT transform code, produces actionable migration plans
2. **Dual input** — accepts scan JSON file OR runs scan internally (convenience mode)
3. **Triple output** — terminal, markdown, JSON (consistent with scan and bench)
4. **Integrated web UI** — adds Migrate page to existing bench sidebar, not a separate app
5. **Language-aware code examples** — JS/TS, Python, Go, Rust, Java/Kotlin with specific PQC library recommendations
6. **Phased prioritization** — immediate (CRITICAL), short-term (WARNING), long-term (INFO)

### Next step
Invoke the **writing-plans** skill to create the implementation plan from the spec, then execute with subagent-driven development (same approach used for bench).

### Important notes
- Sole contributor: varmabudharaju (no Co-Authored-By trailers)
- Push to `origin main` via PR, squash merge
- qcrypt-scan needs to be available as a local import for the scan integration — either symlink, npm link, or copy the scan function
- Extend existing `src/api/server.ts` and `web/src/` rather than creating new apps
