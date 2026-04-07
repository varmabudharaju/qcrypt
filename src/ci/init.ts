import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import type { CIProvider } from './detect.js';

interface ScaffoldResult {
  created: boolean;
  filePath: string;
  error?: string;
}

const TEMPLATES: Record<CIProvider, string> = {
  github: `name: Quantum Crypto Scan
on: [push, pull_request]
jobs:
  qcrypt-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Run quantum crypto scan
        run: npx qcrypt-scan scan . --ci --fail-on=C
      - name: Upload SARIF results
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: qcrypt-results.sarif
`,
  gitlab: `qcrypt-scan:
  image: node:20
  stage: test
  script:
    - npx qcrypt-scan scan . --ci --fail-on=C
  artifacts:
    reports:
      codequality: gl-code-quality-report.json
    when: always
`,
  generic: `#!/usr/bin/env bash
# qcrypt-ci.sh — Quantum crypto scan for CI pipelines
# Usage: bash qcrypt-ci.sh [path] [fail-on-grade]
set -euo pipefail

TARGET="\${1:-.}"
THRESHOLD="\${2:-C}"

npx qcrypt-scan scan "$TARGET" --ci --fail-on="$THRESHOLD" --sarif qcrypt-results.sarif
`,
};

function getOutputPath(provider: CIProvider, targetDir: string): string {
  switch (provider) {
    case 'github': return join(targetDir, '.github', 'workflows', 'qcrypt-scan.yml');
    case 'gitlab': return join(targetDir, '.gitlab-ci.yml');
    case 'generic': return join(targetDir, 'qcrypt-ci.sh');
  }
}

export function scaffoldWorkflow(provider: CIProvider, targetDir: string, force: boolean): ScaffoldResult {
  const outputPath = getOutputPath(provider, targetDir);

  if (existsSync(outputPath) && !force) {
    return { created: false, filePath: outputPath, error: `${outputPath} already exists. Use --force to overwrite.` };
  }

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, TEMPLATES[provider]);

  return { created: true, filePath: outputPath };
}

export function getNextSteps(provider: CIProvider): string {
  switch (provider) {
    case 'github':
      return 'Workflow created! Push to GitHub to run the scan on every PR.\nSARIF results will appear in the Security tab under Code Scanning.';
    case 'gitlab':
      return 'Config created! Push to GitLab to run the scan.\nCode Quality results will appear in merge request widgets.';
    case 'generic':
      return 'Script created! Run `bash qcrypt-ci.sh` in your CI pipeline.\nPass a path and grade threshold: `bash qcrypt-ci.sh ./src C`';
  }
}
