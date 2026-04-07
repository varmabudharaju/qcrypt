import chalk from 'chalk';
import type { ScanReport, RiskLevel } from '../types.js';
import { computeDeadlineStatus } from '../reference/nist-deadlines.js';

const riskColors: Record<RiskLevel, (s: string) => string> = {
  CRITICAL: chalk.red.bold,
  WARNING: chalk.yellow,
  INFO: chalk.blue,
  OK: chalk.green,
};

const gradeColors: Record<string, (s: string) => string> = {
  A: chalk.green.bold,
  B: chalk.green,
  C: chalk.yellow,
  D: chalk.red,
  F: chalk.red.bold,
};

function renderBar(score: number, max: number): string {
  const width = 10;
  const filled = Math.round((score / max) * width);
  const empty = width - filled;
  return chalk.green('█'.repeat(filled)) + chalk.dim('░'.repeat(empty));
}

export function formatTerminal(report: ScanReport): string {
  const lines: string[] = [];
  const r = report.readiness;

  lines.push('');
  lines.push(chalk.bold('  qcrypt-scan  ') + chalk.dim('Quantum Cryptography Scanner'));
  lines.push(chalk.dim('  ' + '─'.repeat(50)));
  lines.push('');
  lines.push(`  ${chalk.dim('Path:')}    ${report.path}`);
  lines.push(`  ${chalk.dim('Files:')}   ${report.filesScanned} scanned`);

  // Language coverage warning
  const lc = report.languageCoverage;
  if (lc && lc.unsupportedExtensions.length > 0) {
    const dominant = lc.unsupportedExtensions[0];
    const totalSource = lc.scanned + lc.skipped;
    const pct = Math.round((lc.skipped / totalSource) * 100);
    if (pct > 30) {
      lines.push('');
      lines.push(chalk.yellow.bold('  !! COVERAGE WARNING'));
      const extList = lc.unsupportedExtensions.map((e) => `${e.count} ${e.ext}`).join(', ');
      lines.push(chalk.yellow(`  ${pct}% of files use unsupported languages (${extList})`));
      lines.push(chalk.yellow('  Results reflect scanned files only. Actual crypto posture may differ.'));
    }
  }
  lines.push('');

  // Grade + Readiness
  const gradeStr = (gradeColors[report.grade] ?? chalk.white)(report.grade);
  lines.push(`  ${chalk.dim('Grade:')} ${gradeStr}  ${chalk.dim('│')}  ${chalk.bold('PQC Readiness:')} ${r.overall}/100`);
  lines.push(`         ${chalk.dim('│')}  Vulnerability ${renderBar(r.dimensions.vulnerability.weighted, 40)} ${Math.round(r.dimensions.vulnerability.weighted)}/40`);
  lines.push(`         ${chalk.dim('│')}  Priority      ${renderBar(r.dimensions.priority.weighted, 25)} ${Math.round(r.dimensions.priority.weighted)}/25`);
  lines.push(`         ${chalk.dim('│')}  Migration     ${renderBar(r.dimensions.migration.weighted, 20)} ${Math.round(r.dimensions.migration.weighted)}/20`);
  lines.push(`         ${chalk.dim('│')}  Agility       ${renderBar(r.dimensions.agility.weighted, 15)} ${Math.round(r.dimensions.agility.weighted)}/15`);
  lines.push('');

  // Summary counts
  lines.push(chalk.bold('  Summary'));
  lines.push(
    `    ${chalk.red('CRITICAL')}: ${report.summary.critical}  ` +
    `${chalk.yellow('WARNING')}: ${report.summary.warning}  ` +
    `${chalk.blue('INFO')}: ${report.summary.info}  ` +
    `${chalk.green('OK')}: ${report.summary.ok}`,
  );

  // Usage breakdown
  const ub = report.usageBreakdown;
  const ubParts: string[] = [];
  if (ub.operations > 0) ubParts.push(chalk.red.bold(`${ub.operations} active operations`));
  if (ub.keyMaterial > 0) ubParts.push(chalk.red(`${ub.keyMaterial} key material`));
  if (ub.config > 0) ubParts.push(chalk.yellow(`${ub.config} config`));
  if (ub.imports > 0) ubParts.push(chalk.dim(`${ub.imports} imports/deps`));
  if (ub.references > 0) ubParts.push(chalk.dim(`${ub.references} references`));
  if (ub.comments > 0) ubParts.push(chalk.dim.italic(`${ub.comments} comments (excluded)`));
  if (ubParts.length > 0) {
    lines.push(`    ${chalk.dim('Breakdown:')} ${ubParts.join(chalk.dim(' · '))}`);
  }
  lines.push('');

  // HNDL Warning
  const hndlFindings = report.enrichedFindings.filter(
    (f) => f.context.hndlRisk && f.risk === 'CRITICAL',
  );
  if (hndlFindings.length > 0) {
    const algorithms = [...new Set(hndlFindings.map((f) => f.algorithm))].join(', ');
    lines.push(chalk.red.bold('  !! HARVEST-NOW-DECRYPT-LATER RISK'));
    lines.push(chalk.red(`  ${hndlFindings.length} key exchange algorithm(s) (${algorithms}) are vulnerable`));
    lines.push(chalk.red('  to data capture attacks happening today.'));
    lines.push('');
  }

  // Quantum Threat Analysis
  const qs = report.quantumSummary;
  if (qs && qs.threats.length > 0) {
    lines.push(chalk.bold('  Quantum Threat Analysis'));
    lines.push('');
    if (qs.weakestLink) {
      const wl = qs.weakestLink;
      lines.push(`    ${chalk.red.bold('Weakest link:')} ${wl.algorithm}`);
      lines.push(`    ${chalk.dim('Classical:')} ${wl.classicalBreakTime}`);
      lines.push(`    ${chalk.red('Quantum:')}   ${wl.quantumBreakTime} ${chalk.dim('(' + wl.qubitsRequired + ')')}`);
      lines.push(`    ${chalk.dim('Attack:')}    ${wl.quantumAlgorithm} — ${wl.speedup} speedup`);
      lines.push(`    ${chalk.dim('Source:')}    ${wl.citation}`);
      lines.push('');
    }

    const brokenQ = qs.threats.filter((t) => t.threatLevel === 'broken-quantum');
    const weakened = qs.threats.filter((t) => t.threatLevel === 'weakened');
    const safe = qs.threats.filter((t) => t.threatLevel === 'quantum-safe');

    if (brokenQ.length > 0) {
      lines.push(`    ${chalk.red('⬤')} ${chalk.red.bold('Broken by quantum')}  ${brokenQ.map((t) => t.algorithm).join(', ')}`);
    }
    if (weakened.length > 0) {
      lines.push(`    ${chalk.yellow('◐')} ${chalk.yellow('Weakened')}            ${weakened.map((t) => t.algorithm).join(', ')}`);
    }
    if (safe.length > 0) {
      lines.push(`    ${chalk.green('●')} ${chalk.green('Quantum-safe')}        ${safe.map((t) => t.algorithm).join(', ')}`);
    }
    lines.push('');
  }

  // NIST Compliance Deadline (production findings only)
  const prodFindingsAll = report.enrichedFindings.filter((f) => !f.context.isTestFile);
  const uniqueAlgos = [...new Set(prodFindingsAll.map((f) => f.algorithm))];
  const deadlineStatuses = uniqueAlgos
    .map((a) => ({ algo: a, status: computeDeadlineStatus(a) }))
    .filter((d) => d.status !== null && d.status.status !== 'safe')
    .sort((a, b) => (a.status!.yearsRemaining ?? -1) - (b.status!.yearsRemaining ?? -1));

  if (deadlineStatuses.length > 0) {
    lines.push(chalk.bold('  NIST Compliance Deadline'));
    lines.push('');
    for (const { algo, status } of deadlineStatuses) {
      const ds = status!;
      const icon = ds.status === 'overdue' ? chalk.red('✗')
        : ds.status === 'urgent' ? chalk.yellow('!')
        : chalk.dim('○');
      const timeStr = ds.yearsRemaining === null
        ? chalk.red('OVERDUE')
        : ds.status === 'urgent'
          ? chalk.yellow(`${ds.yearsRemaining}y remaining`)
          : chalk.dim(`${ds.yearsRemaining}y remaining`);
      const count = prodFindingsAll.filter((f) => f.algorithm === algo).length;
      lines.push(`    ${icon} ${algo}: prohibited ${ds.deadline.prohibited} (${timeStr}) — ${count} finding${count !== 1 ? 's' : ''}`);
    }
    lines.push(`    ${chalk.dim('Source: ' + deadlineStatuses[0].status!.deadline.source)}`);
    lines.push('');
  }

  if (report.enrichedFindings.length === 0) {
    const hasLowCoverage = lc && lc.unsupportedExtensions.length > 0 &&
      lc.skipped / (lc.scanned + lc.skipped) > 0.3;
    if (hasLowCoverage) {
      lines.push(chalk.dim('  No findings in scanned files. Unsupported languages were not analyzed.'));
    } else {
      lines.push(chalk.green('  No quantum-vulnerable cryptography found. Your project appears quantum-safe!'));
    }
    lines.push('');
    return lines.join('\n');
  }

  // Findings (production files first, test files dimmed at end)
  const prodFindings = report.enrichedFindings.filter((f) => !f.context.isTestFile && f.usageType !== 'comment');
  const commentFindings = report.enrichedFindings.filter((f) => f.usageType === 'comment');
  const testFindings = report.enrichedFindings.filter((f) => f.context.isTestFile && f.usageType !== 'comment');

  if (prodFindings.length > 0) {
    lines.push(chalk.bold('  Findings'));
    lines.push('');

    for (const finding of prodFindings) {
      const badge = riskColors[finding.risk](`[${finding.risk}]`);
      const usageTag = finding.usageType === 'operation' ? chalk.red(' ⬤ operation')
        : finding.usageType === 'import' ? chalk.dim(' ○ import')
        : finding.usageType === 'key-material' ? chalk.red(' ⬤ key-material')
        : finding.usageType === 'config' ? chalk.yellow(' ◐ config')
        : chalk.dim(' ○ reference');
      lines.push(`  ${badge} ${chalk.bold(finding.algorithm)} in ${chalk.cyan(finding.file)}:${finding.line}${usageTag}`);
      lines.push(`    ${chalk.dim(finding.snippet)}`);

      // Context badges
      const badges: string[] = [];
      if (finding.context.hndlRisk) badges.push(chalk.red('HNDL Risk'));
      badges.push(`Sensitivity: ${finding.context.sensitivity.toUpperCase()}`);
      badges.push(`Effort: ${finding.context.migrationEffort.toUpperCase()}`);
      lines.push(`    ${badges.join(chalk.dim(' │ '))}`);

      lines.push(`    ${chalk.dim('Why:')} ${finding.explanation}`);
      lines.push(`    ${chalk.dim('Fix:')} ${finding.replacement}`);
      lines.push('');
    }
  }

  if (testFindings.length > 0) {
    lines.push(chalk.dim(`  Test files (${testFindings.length} finding(s) — not counted in score)`));
    for (const finding of testFindings) {
      lines.push(chalk.dim(`    ${finding.algorithm} in ${finding.file}:${finding.line}`));
    }
    lines.push('');
  }

  return lines.join('\n');
}
