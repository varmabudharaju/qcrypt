// src/compliance/assess.ts
import type { ScanReport, Finding } from '../types.js';
import { FRAMEWORKS, RULES, type ComplianceFramework, type ComplianceRule, type ComplianceStatus } from './frameworks.js';

export interface ComplianceViolation {
  finding: Finding;
  rule: ComplianceRule;
  status: ComplianceStatus;
}

export interface ComplianceAssessment {
  framework: ComplianceFramework;
  status: 'pass' | 'fail' | 'warning';
  findings: ComplianceViolation[];
  summary: {
    total: number;
    nonCompliant: number;
    deprecated: number;
    compliant: number;
  };
}

export interface FullComplianceReport {
  scanId: string;
  assessments: ComplianceAssessment[];
  overallStatus: 'pass' | 'fail' | 'warning';
  blockingCount: number;
}

function matchRule(algorithm: string, rules: ComplianceRule[]): ComplianceRule | null {
  for (const rule of rules) {
    if (new RegExp(rule.algorithmPattern, 'i').test(algorithm)) {
      return rule;
    }
  }
  return null;
}

function assessFramework(framework: ComplianceFramework, findings: Finding[]): ComplianceAssessment {
  const rules = RULES[framework.id] || [];
  const violations: ComplianceViolation[] = [];

  for (const finding of findings) {
    if (finding.risk === 'OK') continue;
    const rule = matchRule(finding.algorithm, rules);
    if (rule) {
      violations.push({ finding, rule, status: rule.status });
    }
  }

  const nonCompliant = violations.filter((v) => v.status === 'non-compliant').length;
  const deprecated = violations.filter((v) => v.status === 'deprecated').length;
  const compliant = findings.length - violations.length;

  let status: 'pass' | 'fail' | 'warning' = 'pass';
  if (nonCompliant > 0) status = 'fail';
  else if (deprecated > 0) status = 'warning';

  return {
    framework,
    status,
    findings: violations,
    summary: { total: findings.length, nonCompliant, deprecated, compliant },
  };
}

export function assessCompliance(scanReport: ScanReport): FullComplianceReport {
  const assessments = FRAMEWORKS.map((fw) => assessFramework(fw, scanReport.findings));
  const blockingCount = assessments.reduce((sum, a) => sum + a.summary.nonCompliant, 0);

  let overallStatus: 'pass' | 'fail' | 'warning' = 'pass';
  if (assessments.some((a) => a.status === 'fail')) overallStatus = 'fail';
  else if (assessments.some((a) => a.status === 'warning')) overallStatus = 'warning';

  return {
    scanId: scanReport.id,
    assessments,
    overallStatus,
    blockingCount,
  };
}
