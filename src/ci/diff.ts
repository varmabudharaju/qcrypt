import type { Finding, ScanReport } from '../types.js';

export interface FindingDiff {
  newFindings: Finding[];
  resolvedFindings: Finding[];
  unchangedCount: number;
  baseGrade: string;
  prGrade: string;
  gradeChanged: boolean;
  baseSummary: { critical: number; warning: number; info: number; ok: number };
  prSummary: { critical: number; warning: number; info: number; ok: number };
  prReport: ScanReport;
}

/**
 * Create a fingerprint for a finding.
 * Match by file + algorithm + normalized snippet.
 * This handles line number shifts (same code moved to different line)
 * while correctly detecting new crypto additions.
 */
function fingerprint(f: Finding): string {
  // Normalize snippet: trim, collapse whitespace
  const normalizedSnippet = f.snippet.trim().replace(/\s+/g, ' ');
  return `${f.file}::${f.algorithm}::${normalizedSnippet}`;
}

/**
 * Compare two scan reports and compute what's new vs resolved.
 *
 * - "New" = in PR but not in base (new crypto introduced by this PR)
 * - "Resolved" = in base but not in PR (crypto removed by this PR)
 * - "Unchanged" = in both (existing crypto, not this PR's fault)
 */
export function diffScans(baseReport: ScanReport, prReport: ScanReport): FindingDiff {
  const baseFingerprints = new Map<string, Finding>();
  for (const f of baseReport.findings) {
    baseFingerprints.set(fingerprint(f), f);
  }

  const prFingerprints = new Map<string, Finding>();
  for (const f of prReport.findings) {
    prFingerprints.set(fingerprint(f), f);
  }

  const newFindings: Finding[] = [];
  const resolvedFindings: Finding[] = [];
  let unchangedCount = 0;

  // Findings in PR but not in base = new
  for (const [fp, finding] of prFingerprints) {
    if (!baseFingerprints.has(fp)) {
      newFindings.push(finding);
    } else {
      unchangedCount++;
    }
  }

  // Findings in base but not in PR = resolved
  for (const [fp, finding] of baseFingerprints) {
    if (!prFingerprints.has(fp)) {
      resolvedFindings.push(finding);
    }
  }

  // Sort new findings by severity
  const riskOrder: Record<string, number> = { CRITICAL: 0, WARNING: 1, INFO: 2, OK: 3 };
  newFindings.sort((a, b) => riskOrder[a.risk] - riskOrder[b.risk]);
  resolvedFindings.sort((a, b) => riskOrder[a.risk] - riskOrder[b.risk]);

  return {
    newFindings,
    resolvedFindings,
    unchangedCount,
    baseGrade: baseReport.grade,
    prGrade: prReport.grade,
    gradeChanged: baseReport.grade !== prReport.grade,
    baseSummary: baseReport.summary,
    prSummary: prReport.summary,
    prReport,
  };
}

/**
 * Determine if the diff should fail a CI check.
 * Only fails if NEW findings exceed the threshold — existing tech debt is ignored.
 */
export function shouldFail(diff: FindingDiff, failOn: 'critical' | 'warning' | 'any'): boolean {
  if (failOn === 'critical') {
    return diff.newFindings.some((f) => f.risk === 'CRITICAL');
  }
  if (failOn === 'warning') {
    return diff.newFindings.some((f) => f.risk === 'CRITICAL' || f.risk === 'WARNING');
  }
  // 'any' — fail on any new non-OK finding
  return diff.newFindings.some((f) => f.risk !== 'OK');
}
