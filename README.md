# qcrypt-scan

Scan your codebase for quantum-vulnerable cryptography. Get a grade, understand the risks, and learn what to replace.

Part of the **qcrypt** series: `scan` → `bench` → `migrate`

## Quick Start

```bash
npx qcrypt-scan ./my-project
```

## What It Detects

| Risk | Examples | Quantum Threat |
|------|----------|----------------|
| CRITICAL | RSA, ECDSA, ECDH, DSA, DH | Broken by Shor's algorithm |
| WARNING | AES-128, DES, MD5, SHA-1 | Weakened by Grover's algorithm |
| INFO | AES-192 | Reduced security margin |
| OK | AES-256, SHA-256, ML-KEM, ML-DSA | Quantum-resistant |

## Usage

```bash
# Scan with colored terminal output
qcrypt-scan ./my-project

# JSON output (for CI/CD)
qcrypt-scan ./my-project --json

# Start API server
qcrypt-scan --serve --port 3100
```

## API

```bash
# Health check
curl http://localhost:3100/api/health

# Scan a project
curl -X POST http://localhost:3100/api/scan \
  -H "Content-Type: application/json" \
  -d '{"path": "/path/to/project"}'
```

## Supported Languages

Python, JavaScript/TypeScript, Go, Rust, Java

Also scans: certificates (PEM/x509), config files (nginx, SSH, Apache), dependencies (npm, pip, go.mod)

## Grading

- **A** — No critical or warning findings
- **B** — No critical, some warnings
- **C** — 1-3 critical findings
- **D** — 4-10 critical findings
- **F** — 10+ critical findings

## License

MIT
