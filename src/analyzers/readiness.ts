import type { EnrichedFinding, ReadinessScore } from '../types.js';
import { computeAgilityScore } from './agility.js';
import { computeMigrationScore } from './migration.js';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function computeVulnerabilityScore(
  findings: EnrichedFinding[],
  filesScanned: number,
) {
  const WEIGHT = 0.40;
  let raw = 100;

  for (const f of findings) {
    if (f.context.isTestFile) continue;
    if (f.usageType === 'comment') continue;

    // Imports/references have reduced impact on score
    const weight = f.usageType === 'import' ? 0.3
      : f.usageType === 'reference' ? 0.5
      : 1.0;

    if (f.risk === 'CRITICAL') {
      const deduction = clamp(400 / Math.max(filesScanned, 1), 3, 8) * weight;
      raw -= deduction;
    } else if (f.risk === 'WARNING') {
      const deduction = clamp(100 / Math.max(filesScanned, 1), 1, 3) * weight;
      raw -= deduction;
    }
  }

  raw = clamp(raw, 0, 100);
  const score = Math.round(raw);
  return {
    score,
    weighted: Math.round(score * WEIGHT * 100) / 100,
    details: `${findings.filter((f) => !f.context.isTestFile && f.risk === 'CRITICAL').length} critical, ${findings.filter((f) => !f.context.isTestFile && f.risk === 'WARNING').length} warning (normalized over ${filesScanned} files)`,
  };
}

function computePriorityScore(findings: EnrichedFinding[]) {
  const WEIGHT = 0.25;
  let raw = 100;

  for (const f of findings) {
    if (f.risk !== 'CRITICAL') continue;

    if (f.context.hndlRisk) raw -= 12;
    if (f.context.sensitivity === 'high') raw -= 8;
    else if (f.context.sensitivity === 'medium') raw -= 5;
    else raw -= 2;
  }

  raw = clamp(raw, 0, 100);
  const score = Math.round(raw);
  const hndlCount = findings.filter((f) => f.context.hndlRisk && f.risk === 'CRITICAL').length;
  const highCount = findings.filter((f) => f.context.sensitivity === 'high' && f.risk === 'CRITICAL').length;

  const parts: string[] = [];
  if (hndlCount > 0) parts.push(`${hndlCount} HNDL-risk finding(s)`);
  if (highCount > 0) parts.push(`${highCount} in high-sensitivity paths`);
  if (parts.length === 0) parts.push('No high-priority exposures');

  return {
    score,
    weighted: Math.round(score * WEIGHT * 100) / 100,
    details: parts.join(', '),
  };
}

export function computeReadinessScore(
  findings: EnrichedFinding[],
  filesScanned: number,
): ReadinessScore {
  const vulnerability = computeVulnerabilityScore(findings, filesScanned);
  const priority = computePriorityScore(findings);
  const rawMigration = computeMigrationScore(findings);
  // When there are no findings there is nothing to migrate; treat as fully ready.
  const migration =
    findings.length === 0
      ? { score: 100, weighted: Math.round(100 * 0.20 * 100) / 100, details: rawMigration.details }
      : rawMigration;
  const agility = computeAgilityScore(findings);

  const overall = Math.round(
    vulnerability.weighted + priority.weighted + migration.weighted + agility.weighted,
  );

  return {
    overall: clamp(overall, 0, 100),
    dimensions: { vulnerability, priority, migration, agility },
  };
}
