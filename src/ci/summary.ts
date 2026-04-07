import type { ScanReport } from '../types.js';
import type { CIProvider } from './detect.js';
import type { Grade } from './exit.js';
import type { FullComplianceReport } from '../compliance/index.js';

export interface CISummaryInput {
  report: ScanReport;
  provider: CIProvider;
  threshold: Grade;
  pass: boolean;
  sarifPath: string | null;
  durationMs: number;
  compliance: FullComplianceReport | null;
}

export interface CISummary {
  tool: string;
  version: string;
  provider: CIProvider;
  path: string;
  grade: string;
  threshold: string;
  pass: boolean;
  filesScanned: number;
  findings: { critical: number; warning: number; info: number; ok: number };
  topFindings: { file: string; line: number; algorithm: string; risk: string }[];
  sarif?: string;
  compliance?: {
    overallStatus: string;
    blockingCount: number;
    frameworks: { id: string; status: string; nonCompliant: number }[];
  };
  duration: string;
}

export function buildSummary(input: CISummaryInput): CISummary {
  const { report, provider, threshold, pass, sarifPath, durationMs } = input;

  const topFindings = report.findings
    .filter((f) => f.risk === 'CRITICAL' || f.risk === 'WARNING')
    .slice(0, 10)
    .map((f) => ({
      file: f.file,
      line: f.line,
      algorithm: f.algorithm,
      risk: f.risk.toLowerCase(),
    }));

  const summary: CISummary = {
    tool: 'qcrypt-scan',
    version: '0.2.0',
    provider,
    path: report.path,
    grade: report.grade,
    threshold,
    pass,
    filesScanned: report.filesScanned,
    findings: report.summary,
    topFindings,
    duration: `${(durationMs / 1000).toFixed(1)}s`,
  };

  if (sarifPath) {
    summary.sarif = sarifPath;
  }

  if (input.compliance) {
    summary.compliance = {
      overallStatus: input.compliance.overallStatus,
      blockingCount: input.compliance.blockingCount,
      frameworks: input.compliance.assessments.map((a) => ({
        id: a.framework.id,
        status: a.status,
        nonCompliant: a.summary.nonCompliant,
      })),
    };
  }

  return summary;
}
