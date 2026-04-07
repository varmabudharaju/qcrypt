import type { ScanReport, Finding, RiskLevel } from '../types.js';

const SARIF_SCHEMA = 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/main/sarif-2.1/schema/sarif-schema-2.1.0.json';

function riskToLevel(risk: RiskLevel): string {
  switch (risk) {
    case 'CRITICAL': return 'error';
    case 'WARNING': return 'warning';
    case 'INFO': return 'note';
    default: return 'none';
  }
}

function buildRules(findings: Finding[]) {
  const seen = new Map<string, Finding>();
  for (const f of findings) {
    if (f.risk === 'OK') continue;
    if (!seen.has(f.algorithm)) seen.set(f.algorithm, f);
  }
  return Array.from(seen.values()).map((f) => ({
    id: f.algorithm,
    shortDescription: { text: f.explanation },
    help: { text: `Migrate to ${f.replacement}`, markdown: `Migrate to \`${f.replacement}\`` },
  }));
}

function buildResults(findings: Finding[]) {
  return findings
    .filter((f) => f.risk !== 'OK')
    .map((f) => ({
      ruleId: f.algorithm,
      level: riskToLevel(f.risk),
      message: { text: `${f.explanation}. Migrate to ${f.replacement}.` },
      locations: [
        {
          physicalLocation: {
            artifactLocation: { uri: f.file },
            region: { startLine: f.line },
          },
        },
      ],
    }));
}

export function generateSarif(report: ScanReport) {
  return {
    $schema: SARIF_SCHEMA,
    version: '2.1.0' as const,
    runs: [
      {
        tool: {
          driver: {
            name: 'qcrypt-scan',
            version: '0.2.0',
            rules: buildRules(report.findings),
          },
        },
        results: buildResults(report.findings),
      },
    ],
  };
}
