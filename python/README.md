# qcrypt-scan

Scan codebases for quantum-vulnerable cryptography. Supports Python, JavaScript, TypeScript, Go, Rust, Java, C/C++, Ruby, and PHP.

## Install

```bash
pip install qcrypt-scan
```

Requires Node.js 18+ ([install](https://nodejs.org/)).

## Usage

```bash
# Scan a local project
qcrypt-scan /path/to/project

# Scan a GitHub repo
qcrypt-scan https://github.com/org/repo

# JSON output
qcrypt-scan . --json

# CI mode — fail if grade drops below C
qcrypt-scan . --ci --fail-on C
```

## GitHub Action

Add to `.github/workflows/qcrypt-scan.yml`:

```yaml
name: Quantum Crypto Scan
on:
  pull_request:
    branches: [main]

permissions:
  contents: read
  pull-requests: write

jobs:
  qcrypt-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: varmabudharaju/qcrypt-scan@main
        with:
          fail-on: critical
```

The action is diff-aware — it only reports NEW findings introduced by the PR, not existing tech debt.

## What it detects

- RSA, ECDSA, ECDH, Ed25519, DSA, DH (broken by Shor's algorithm)
- MD5, SHA-1, DES, 3DES, RC4 (classically broken)
- AES-128 (weakened by Grover's algorithm)
- TLS 1.0/1.1, SSLv2/v3 (deprecated protocols)

## License

MIT
