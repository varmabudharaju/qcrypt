import { createHash } from 'node:crypto';
import type { Finding, RiskLevel } from '../types.js';
import type { CIProvider } from './detect.js';

function buildMessage(finding: Finding): string {
  return `${finding.algorithm}: ${finding.explanation}. Migrate to ${finding.replacement}.`;
}

function riskToGitHub(risk: RiskLevel): string {
  switch (risk) {
    case 'CRITICAL': return 'error';
    case 'WARNING': return 'warning';
    case 'INFO': return 'notice';
    default: return 'notice';
  }
}

function riskToGeneric(risk: RiskLevel): string {
  switch (risk) {
    case 'CRITICAL': return 'ERROR';
    case 'WARNING': return 'WARNING';
    case 'INFO': return 'NOTE';
    default: return 'NOTE';
  }
}

function riskToGitLab(risk: RiskLevel): string {
  switch (risk) {
    case 'CRITICAL': return 'critical';
    case 'WARNING': return 'major';
    case 'INFO': return 'minor';
    default: return 'info';
  }
}

function formatGitHub(findings: Finding[]): string[] {
  const actionable = findings.filter((f) => f.risk !== 'OK');
  return actionable.map((f) => {
    const level = riskToGitHub(f.risk);
    const msg = buildMessage(f);
    return `::${level} file=${f.file},line=${f.line}::${msg}`;
  });
}

function formatGitLab(findings: Finding[]): string[] {
  const actionable = findings.filter((f) => f.risk !== 'OK');
  if (actionable.length === 0) return [];
  const issues = actionable.map((f) => ({
    description: buildMessage(f),
    fingerprint: createHash('sha256').update(`${f.file}:${f.line}:${f.algorithm}`).digest('hex'),
    severity: riskToGitLab(f.risk),
    location: { path: f.file, lines: { begin: f.line } },
  }));
  return [JSON.stringify(issues)];
}

function formatGeneric(findings: Finding[]): string[] {
  const actionable = findings.filter((f) => f.risk !== 'OK');
  return actionable.map((f) => {
    const level = riskToGeneric(f.risk);
    const msg = buildMessage(f);
    return `${level}: ${f.file}:${f.line} — ${msg}`;
  });
}

export function formatAnnotations(findings: Finding[], provider: CIProvider): string[] {
  switch (provider) {
    case 'github': return formatGitHub(findings);
    case 'gitlab': return formatGitLab(findings);
    case 'generic': return formatGeneric(findings);
  }
}
