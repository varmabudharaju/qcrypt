import type { FindingDiff } from './diff.js';
import type { Finding } from '../types.js';
import { getQuantumEstimate } from '../reference/quantum-estimates.js';

const RISK_EMOJI: Record<string, string> = {
  CRITICAL: '🔴',
  WARNING: '🟡',
  INFO: '🔵',
  OK: '🟢',
};

const USAGE_LABEL: Record<string, string> = {
  operation: '⬤ operation',
  'key-material': '⬤ key-material',
  config: '◐ config',
  import: '○ import',
  reference: '○ reference',
  comment: '○ comment',
};

function gradeEmoji(grade: string): string {
  if (grade === 'A') return '🟢';
  if (grade === 'B') return '🟢';
  if (grade === 'C') return '🟡';
  if (grade === 'D') return '🟠';
  return '🔴';
}

function findingsTable(findings: Finding[], limit: number = 15): string {
  if (findings.length === 0) return '_None_\n';

  const rows = findings.slice(0, limit).map((f) => {
    const risk = RISK_EMOJI[f.risk] ?? '⚪';
    const usage = f.usageType ? USAGE_LABEL[f.usageType] ?? '' : '';
    return `| ${risk} ${f.risk} | \`${f.algorithm}\` | \`${f.file}:${f.line}\` | ${usage} |`;
  });

  let table = '| Risk | Algorithm | Location | Type |\n';
  table += '|------|-----------|----------|------|\n';
  table += rows.join('\n') + '\n';

  if (findings.length > limit) {
    table += `\n_...and ${findings.length - limit} more_\n`;
  }

  return table;
}

export function formatGitHubComment(diff: FindingDiff): string {
  const lines: string[] = [];

  // Header
  lines.push('## ⬡ qcrypt-scan — Quantum Crypto Audit\n');

  // Grade + summary
  const gradeStr = diff.gradeChanged
    ? `${gradeEmoji(diff.baseGrade)} **${diff.baseGrade}** → ${gradeEmoji(diff.prGrade)} **${diff.prGrade}**`
    : `${gradeEmoji(diff.prGrade)} **${diff.prGrade}** (no change)`;

  const newCritical = diff.newFindings.filter((f) => f.risk === 'CRITICAL').length;
  const newWarning = diff.newFindings.filter((f) => f.risk === 'WARNING').length;
  const resolvedCount = diff.resolvedFindings.length;

  lines.push(`**Grade:** ${gradeStr} | **New:** ${diff.newFindings.length} | **Resolved:** ${resolvedCount}\n`);

  // New findings
  if (diff.newFindings.length > 0) {
    lines.push('### 🆕 New Findings\n');
    lines.push(findingsTable(diff.newFindings));

    // Quantum threat for new findings
    const newAlgos = [...new Set(diff.newFindings.map((f) => f.algorithm))];
    const worstNew = newAlgos
      .map((a) => getQuantumEstimate(a))
      .filter((e) => e !== null && e.threatLevel === 'broken-quantum');

    if (worstNew.length > 0) {
      const worst = worstNew[0]!;
      lines.push(`\n> ⚠️ **Quantum Threat:** ${worst.algorithm} — breakable in **${worst.quantumBreakTime}** (${worst.quantumAlgorithm})\n`);
    }
  } else {
    lines.push('### ✅ No new quantum-vulnerable crypto introduced\n');
  }

  // Resolved findings
  if (diff.resolvedFindings.length > 0) {
    lines.push('<details>');
    lines.push(`<summary>🗑️ Resolved Findings (${resolvedCount})</summary>\n`);
    lines.push(findingsTable(diff.resolvedFindings));
    lines.push('</details>\n');
  }

  // Summary stats
  lines.push('<details>');
  lines.push('<summary>📊 Full Scan Summary</summary>\n');
  lines.push(`| | Base | PR |`);
  lines.push(`|---|---|---|`);
  lines.push(`| Critical | ${diff.baseSummary.critical} | ${diff.prSummary.critical} |`);
  lines.push(`| Warning | ${diff.baseSummary.warning} | ${diff.prSummary.warning} |`);
  lines.push(`| Info | ${diff.baseSummary.info} | ${diff.prSummary.info} |`);
  lines.push(`| OK | ${diff.baseSummary.ok} | ${diff.prSummary.ok} |`);
  lines.push('');
  lines.push('</details>\n');

  // Footer
  lines.push('---');
  lines.push('*Scanned by [qcrypt-scan](https://github.com/varmabudharaju/qcrypt-scan) — quantum cryptography scanner*');

  return lines.join('\n');
}

/**
 * Format a short summary for the GitHub Check annotation.
 */
export function formatCheckSummary(diff: FindingDiff): string {
  const newCritical = diff.newFindings.filter((f) => f.risk === 'CRITICAL').length;
  const newWarning = diff.newFindings.filter((f) => f.risk === 'WARNING').length;

  if (diff.newFindings.length === 0) {
    return 'No new quantum-vulnerable crypto introduced.';
  }

  const parts: string[] = [];
  if (newCritical > 0) parts.push(`${newCritical} critical`);
  if (newWarning > 0) parts.push(`${newWarning} warning`);

  return `${diff.newFindings.length} new finding(s): ${parts.join(', ')}. Grade: ${diff.baseGrade} → ${diff.prGrade}`;
}
