# qcrypt — Handoff Document

Start a new session with: **"let's build the multi-project dashboard"** and I'll pick up right where we left off.

## What exists

**Repo:** https://github.com/varmabudharaju/qcrypt
**Branch:** `feat/qcrypt-migrate` (PR #2 open against `main`)
**Working directory:** `/Users/varma/qcrypt-bench`

### qcrypt-bench (tool 2 — complete)
- 66 tests passing across 13 test files
- CLI: `npx tsx src/cli.ts` with `--iterations`, `--category`, `--json`, `--serve`
- API: Fastify on port 3200 with bench, history, reference endpoints
- Web UI: React + Vite + Tailwind with Dashboard, Comparison, Education pages

### qcrypt-scan (tool 1 — separate repo)
- Lives at `/Users/varma/qcrypt-scan`
- Scans codebases for quantum-vulnerable crypto
- Added as `file:../qcrypt-scan` dependency in qcrypt-bench

### qcrypt-migrate (tool 3 — complete, on feat/qcrypt-migrate branch)
- 84 new tests (150 total), all passing
- CLI: `npx tsx src/migrate/cli.ts` with `--scan-file`, `--json`, `--markdown`, `--serve`, `[path]`
- API: POST /api/migrate, GET history, GET by id, GET /api/browse (folder browser)
- Web UI: Migrate page with folder browser, scan summary card (grade badge, risk bar), expandable step cards, markdown download
- Code examples for JS/TS, Python, Go, Rust, Java/Kotlin with fallback chains
- Phased prioritization: immediate (CRITICAL), short-term (WARNING), long-term (INFO)

## What to build next

**Phase 1: Multi-Project Security Dashboard**

### Design spec (approved)
`docs/superpowers/specs/2026-03-29-multi-project-dashboard-design.md`

### Key decisions already made
1. **SQLite via better-sqlite3** — persistent storage in `~/.qcrypt/qcrypt.db`
2. **Auto-create projects** — scanning a path creates the project, no manual setup
3. **Overview dashboard as home** — org-level stats (total projects, worst grade, critical count) + project cards grid with trend sparklines
4. **Project detail page** — scan history chart, latest scan summary, migration steps
5. **Sidebar reorganized** — Overview (home), Benchmark (renamed from Dashboard), Comparison, Education
6. **Migrate page absorbed** — becomes part of project detail, not standalone

### Next step
Invoke the **writing-plans** skill to create the implementation plan from the spec, then execute with subagent-driven development.

### Important notes
- Sole contributor: varmabudharaju
- Push to `origin main` via PR, squash merge
- The existing `/api/migrate` endpoint stays for CLI backward compatibility
- New API: `/api/projects`, `/api/projects/:id`, `/api/projects/:id/scan`, `/api/scan`, `/api/overview`
- New source: `src/db/index.ts`, `src/db/projects.ts`, `src/db/scans.ts`
