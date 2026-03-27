# qcrypt-scan UI — Design Spec

**Date:** 2026-03-27
**Status:** Approved

## Problem

Non-terminal users need a visual way to scan codebases for quantum-vulnerable crypto. One command (`npx qcrypt-scan --serve`) should give them a full web UI.

## Solution

A React SPA inside `web/` served by the existing Fastify API. Two themes: dark cyberpunk (green-on-black) and light clean SaaS. Theme toggle in nav, persisted to localStorage.

## Tech Stack

- React 18 + Vite (inside `web/`)
- Tailwind CSS with `darkMode: 'class'`
- React Router v6 for navigation
- Fastify serves `web/dist/` as static files

## Theme System

### Dark Theme (Cyberpunk)
- Background: `#0a0a0a`
- Primary accent: `#00FF41` (neon green)
- Cards: `#111111` with `#1a1a1a` borders
- Text: `#e0e0e0`, muted: `#666666`
- Risk badges: red `#ff4444`, yellow `#ffaa00`, blue `#4488ff`, green `#00FF41`

### Light Theme (Clean SaaS)
- Background: `#f8fafc`
- Primary accent: `#3b82f6` (blue-500)
- Cards: `#ffffff` with `#e2e8f0` borders
- Text: `#1e293b`, muted: `#94a3b8`
- Risk badges: red `#ef4444`, yellow `#f59e0b`, blue `#3b82f6`, green `#22c55e`

## Pages

### 1. Dashboard (`/`)
- **Header:** "Security Posture" / "Initiate Quantum Audit" depending on theme
- **Scan input:** Text field for directory path + "Scan" button
- **Stats cards:** Total scanned, Vulnerabilities found, PQC Readiness %
- **Recent scans table:** Repository name, last scan time, severity badge, status, actions

### 2. Scan Results (`/scans/:id`)
- **Header:** Repo/path name + grade circle (0-100 threat level)
- **Severity sidebar:** Critical/High/Medium counts with colored bars
- **Findings list:** Each finding as a card with:
  - Risk badge (CRITICAL/WARNING/INFO/OK)
  - Algorithm name
  - File path + line number
  - CVSS-style score
  - "View Details" expand showing explanation + replacement
- **Remediation panel:** Migration path recommendations
- **Export:** "Share Results" / "Export PDF" buttons (placeholder for v1)

### 3. Leaderboard (`/leaderboard`)
- **Header:** "Global OSS Readiness Index" + overall score
- **Stats:** Active scans, quantum vulnerable items, PQC transitions
- **Rankings table:** Repository, total scanned, PQC compliance %, readiness grade (A-F)
- **CTA section:** "Is your project quantum-ready?" + scan button
- Note: v1 uses local scan history only, not a real global index

### 4. Docs (`/docs`)
- Static educational content about quantum threats
- Links to NIST standards
- Placeholder page for v1

## Layout

- **Sidebar:** Fixed left, contains nav links (Dashboard, Scans, Leaderboard, Docs) + "New Scan" button + user avatar area
- **Top bar:** Search field (cosmetic for v1) + theme toggle + notification bell (cosmetic) + settings gear (cosmetic)
- **Content area:** Right of sidebar, scrollable

## API Changes

### Existing (unchanged)
- `POST /api/scan` — scan a path, return ScanReport
- `GET /api/health` — health check

### New
- `GET /api/scans` — list all scan history (in-memory store)
- `GET /api/scans/:id` — get a specific scan result by ID

### ScanReport Changes
Add `id` field (UUID) to ScanReport so results can be referenced by URL.

### Static File Serving
Fastify serves `web/dist/` at `/` with SPA fallback (all non-API routes serve `index.html`).

## Project Structure

```
web/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css              # Tailwind imports
│   ├── theme.ts               # Theme context + toggle logic
│   ├── api.ts                 # API client (fetch wrappers)
│   ├── components/
│   │   ├── Layout.tsx          # Sidebar + top bar + content area
│   │   ├── Sidebar.tsx         # Nav links + new scan button
│   │   ├── ThemeToggle.tsx     # Dark/light switch
│   │   ├── GradeCircle.tsx     # Circular grade indicator
│   │   ├── RiskBadge.tsx       # CRITICAL/WARNING/INFO/OK badge
│   │   ├── StatsCard.tsx       # Stats display card
│   │   ├── FindingCard.tsx     # Single finding with expand
│   │   └── ScanTable.tsx       # Recent scans table
│   └── pages/
│       ├── Dashboard.tsx
│       ├── ScanResults.tsx
│       ├── Leaderboard.tsx
│       └── Docs.tsx
```

## Build & Serve

```bash
# Development
cd web && npm run dev          # Vite dev server with proxy to API

# Production
npm run build:web              # Build React app
npx qcrypt-scan --serve        # Serves API + built UI on port 3100
```

## Out of Scope (v1)

- Real global leaderboard (uses local data only)
- File upload / drag-and-drop scanning
- PDF export
- User authentication
- Real-time scan progress (scans are fast enough to just show loading)
- Search functionality (cosmetic only)
