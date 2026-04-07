import chalk from 'chalk';
import type { MigrationPlan, MigrationStep } from '../../types.js';

function header(): string {
  return [
    '',
    chalk.bold.green('  qcrypt-migrate') + '  Post-Quantum Migration Guide',
    chalk.dim('  ─'.repeat(28)),
    '',
  ].join('\n');
}

function summarySection(plan: MigrationPlan): string {
  const { summary, scanReport, estimatedEffort } = plan;
  return [
    chalk.bold('  Summary'),
    `    Scan:       ${scanReport.path} (${scanReport.filesScanned} files, grade ${scanReport.grade})`,
    `    Changes:    ${estimatedEffort}`,
    `    ${chalk.red(`Immediate: ${summary.immediate}`)}  ${chalk.yellow(`Short-term: ${summary.shortTerm}`)}  ${chalk.blue(`Long-term: ${summary.longTerm}`)}`,
    '',
  ].join('\n');
}

const PRIORITY_COLOR = {
  immediate: chalk.red,
  'short-term': chalk.yellow,
  'long-term': chalk.blue,
};

const EFFORT_COLOR = {
  low: chalk.green,
  medium: chalk.yellow,
  high: chalk.red,
};

function stepBlock(step: MigrationStep, index: number): string {
  const pColor = PRIORITY_COLOR[step.priority];
  const eColor = EFFORT_COLOR[step.effort];

  const lines = [
    `  ${chalk.bold(`${index + 1}.`)} ${pColor(`[${step.priority}]`)} ${step.action}`,
    `     ${chalk.dim(`${step.finding.file}:${step.finding.line}`)} ${eColor(`effort: ${step.effort}`)}`,
    '',
    ...step.codeExample.split('\n').map((line) => `     ${chalk.dim(line)}`),
    '',
  ];

  if (step.dependencies.length > 0) {
    lines.push(`     ${chalk.cyan('Dependencies:')} ${step.dependencies.join(', ')}`);
  }

  lines.push(`     ${chalk.dim('Note:')} ${step.notes}`, '');

  return lines.join('\n');
}

function phaseSection(title: string, steps: MigrationStep[], startIndex: number): string {
  if (steps.length === 0) return '';
  const lines = [chalk.bold(`  ── ${title} ──`), ''];
  for (let i = 0; i < steps.length; i++) {
    lines.push(stepBlock(steps[i], startIndex + i));
  }
  return lines.join('\n');
}

export function formatTerminal(plan: MigrationPlan): string {
  const immediate = plan.steps.filter((s) => s.priority === 'immediate');
  const shortTerm = plan.steps.filter((s) => s.priority === 'short-term');
  const longTerm = plan.steps.filter((s) => s.priority === 'long-term');

  return [
    header(),
    summarySection(plan),
    phaseSection('Immediate (Critical)', immediate, 0),
    phaseSection('Short-term (Warning)', shortTerm, immediate.length),
    phaseSection('Long-term (Info)', longTerm, immediate.length + shortTerm.length),
  ].join('\n');
}
