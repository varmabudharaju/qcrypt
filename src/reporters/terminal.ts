import chalk from 'chalk';
import type { BenchmarkReport, BenchmarkResult } from '../types.js';

function header(): string {
  return [
    '',
    chalk.bold.green('  qcrypt-bench') + '  Post-Quantum Cryptography Benchmark',
    chalk.dim('  ─'.repeat(28)),
    '',
  ].join('\n');
}

function platformSection(platform: BenchmarkReport['platform']): string {
  return [
    chalk.bold('  Platform'),
    `    OS:    ${platform.os} ${platform.arch}`,
    `    Node:  ${platform.node}`,
    `    CPU:   ${platform.cpuModel}`,
    '',
  ].join('\n');
}

function resultRow(r: BenchmarkResult): string {
  const source = r.isReference ? chalk.dim(' (NIST ref)') : '';
  const qsafe = r.quantumSafe ? chalk.green(' ✓') : chalk.red(' ✗');
  const algo = r.algorithm.padEnd(16);
  const op = r.operation.padEnd(10);
  const ops = String(r.opsPerSecond).padStart(12);
  const avg = r.avgTimeMs.toFixed(4).padStart(12);

  return `    ${algo} ${op} ${ops} ops/s  ${avg} ms${qsafe}${source}`;
}

function resultsSection(results: BenchmarkResult[], iterations: number): string {
  const lines = [
    chalk.bold('  Benchmark Results') + chalk.dim(` (${iterations} iterations)`),
    '',
    chalk.dim('    Algorithm        Operation     ops/sec       avg ms  QS'),
    chalk.dim('    ' + '─'.repeat(68)),
  ];

  const local = results.filter((r) => !r.isReference);
  const reference = results.filter((r) => r.isReference);

  if (local.length > 0) {
    lines.push(chalk.bold.dim('    ── Classical (local) ──'));
    for (const r of local) lines.push(resultRow(r));
  }

  if (reference.length > 0) {
    lines.push('');
    lines.push(chalk.bold.dim('    ── Post-Quantum (NIST reference) ──'));
    for (const r of reference) lines.push(resultRow(r));
  }

  lines.push('');
  return lines.join('\n');
}

function comparisonsSection(comparisons: BenchmarkReport['comparisons']): string {
  if (comparisons.length === 0) return '';

  const lines = [
    chalk.bold('  Comparisons'),
    '',
  ];

  for (const c of comparisons) {
    lines.push(chalk.bold(`    ${c.classical} → ${c.postQuantum}`));
    lines.push(chalk.green(`      Speed:  ${c.speedup}`));
    lines.push(chalk.yellow(`      Size:   ${c.sizeTradeoff}`));
    lines.push(chalk.dim(`      ${c.explanation}`));
    lines.push('');
  }

  return lines.join('\n');
}

export function formatTerminal(report: BenchmarkReport): string {
  return [
    header(),
    platformSection(report.platform),
    resultsSection(report.results, report.iterations),
    comparisonsSection(report.comparisons),
  ].join('\n');
}
