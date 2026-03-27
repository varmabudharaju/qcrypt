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

export function formatTerminal(report: ScanReport): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(chalk.bold('  qcrypt-scan  ') + chalk.dim(`Quantum Cryptography Scanner`));
  lines.push(chalk.dim('  ' + '─'.repeat(50)));
  lines.push('');
  lines.push(`  ${chalk.dim('Path:')}    ${report.path}`);
  lines.push(`  ${chalk.dim('Files:')}   ${report.filesScanned} scanned`);
  lines.push(`  ${chalk.dim('Grade:')}   ${(gradeColors[report.grade] ?? chalk.white)(report.grade)}`);
  lines.push('');

  lines.push(chalk.bold('  Summary'));
  lines.push(
    `    ${chalk.red('CRITICAL')}: ${report.summary.critical}  ` +
    `${chalk.yellow('WARNING')}: ${report.summary.warning}  ` +
    `${chalk.blue('INFO')}: ${report.summary.info}  ` +
    `${chalk.green('OK')}: ${report.summary.ok}`
  );
  lines.push('');

  if (report.findings.length === 0) {
    lines.push(chalk.green('  No quantum-vulnerable cryptography found. Your project appears quantum-safe!'));
    lines.push('');
    return lines.join('\n');
  }

  lines.push(chalk.bold('  Findings'));
  lines.push('');

  for (const finding of report.findings) {
    const badge = riskColors[finding.risk](`[${finding.risk}]`);
    lines.push(`  ${badge} ${chalk.bold(finding.algorithm)} in ${chalk.cyan(finding.file)}:${finding.line}`);
    lines.push(`    ${chalk.dim(finding.snippet)}`);
    lines.push(`    ${chalk.dim('Why:')} ${finding.explanation}`);
    lines.push(`    ${chalk.dim('Fix:')} ${finding.replacement}`);
    lines.push('');
  }

  return lines.join('\n');
}
