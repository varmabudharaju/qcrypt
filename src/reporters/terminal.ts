import chalk from 'chalk';
import type { ScanReport, RiskLevel } from '../types.js';

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

  if (report.enrichedFindings.length === 0) {
    lines.push(chalk.green('  No quantum-vulnerable cryptography found. Your project appears quantum-safe!'));
    lines.push('');
    return lines.join('\n');
  }

  // Findings (production files first, test files dimmed at end)
  const prodFindings = report.enrichedFindings.filter((f) => !f.context.isTestFile);
  const testFindings = report.enrichedFindings.filter((f) => f.context.isTestFile);

  if (prodFindings.length > 0) {
    lines.push(chalk.bold('  Findings'));
    lines.push('');

    for (const finding of prodFindings) {
      const badge = riskColors[finding.risk](`[${finding.risk}]`);
      lines.push(`  ${badge} ${chalk.bold(finding.algorithm)} in ${chalk.cyan(finding.file)}:${finding.line}`);
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
