import { randomUUID } from 'node:crypto';
import type { ScanReport, AlgorithmCategory } from '../types.js';

const primitiveMap: Record<AlgorithmCategory, string> = {
  asymmetric: 'pke',
  symmetric: 'block-cipher',
  hash: 'hash',
  protocol: 'other',
};

export function formatCbom(report: ScanReport): string {
  const algorithmFindings = new Map<string, typeof report.findings>();
  for (const finding of report.findings) {
    const existing = algorithmFindings.get(finding.algorithm) ?? [];
    existing.push(finding);
    algorithmFindings.set(finding.algorithm, existing);
  }

  const components = Array.from(algorithmFindings.entries()).map(([algorithm, findings]) => {
    const first = findings[0];
    return {
      type: 'cryptographic-asset' as const,
      name: algorithm,
      'bom-ref': `crypto-${algorithm}-${randomUUID().slice(0, 8)}`,
      cryptoProperties: {
        assetType: 'algorithm' as const,
        algorithmProperties: {
          primitive: primitiveMap[first.category],
        },
      },
      properties: [
        { name: 'quantumRisk', value: first.risk },
        { name: 'occurrenceCount', value: String(findings.length) },
      ],
      evidence: {
        occurrences: findings.map((f) => ({
          location: `${f.file}:${f.line}`,
          snippet: f.snippet,
        })),
      },
    };
  });

  const cbom = {
    bomFormat: 'CycloneDX' as const,
    specVersion: '1.6' as const,
    serialNumber: `urn:uuid:${randomUUID()}`,
    version: 1,
    metadata: {
      timestamp: report.scannedAt,
      tools: {
        components: [
          {
            type: 'application' as const,
            name: 'qcrypt-scan',
            version: '0.2.0',
          },
        ],
      },
      properties: [
        { name: 'readinessScore', value: String(report.readiness.overall) },
        { name: 'grade', value: report.grade },
      ],
    },
    components,
  };

  return JSON.stringify(cbom, null, 2);
}
