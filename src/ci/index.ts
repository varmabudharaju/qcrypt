import { writeFileSync } from 'node:fs';
import { scan } from '../index.js';
import { assessCompliance } from '../compliance/index.js';
import { detectProvider } from './detect.js';
import { shouldFail, type Grade } from './exit.js';
import { formatAnnotations } from './annotations.js';
import { generateSarif } from './sarif.js';
import { buildSummary, type CISummary } from './summary.js';

export interface CIOptions {
  targetPath: string;
  failOn: Grade;
  sarifPath: string | null;
}

export interface CIResult {
  pass: boolean;
  exitCode: number;
  summary: CISummary;
}

export async function runCI(options: CIOptions): Promise<CIResult> {
  const { targetPath, failOn, sarifPath } = options;

  // Suppress color/spinners in CI mode
  process.env.NO_COLOR = '1';

  const startTime = Date.now();

  const report = await scan(targetPath);
  const compliance = assessCompliance(report);
  const provider = detectProvider();
  const pass = !shouldFail(report.grade, failOn);

  // Emit annotations to stderr — use generic format for GitLab
  // (GitLab CodeQuality JSON goes to a file, not stderr)
  const stderrProvider = provider === 'gitlab' ? 'generic' : provider;
  const annotations = formatAnnotations(report.findings, stderrProvider);
  for (const line of annotations) {
    process.stderr.write(line + '\n');
  }

  // Write SARIF if requested
  const effectiveSarifPath = sarifPath ?? (provider === 'github' ? 'qcrypt-results.sarif' : null);
  if (effectiveSarifPath) {
    const sarif = generateSarif(report);
    writeFileSync(effectiveSarifPath, JSON.stringify(sarif, null, 2));
  }

  // Write GitLab CodeQuality artifact
  if (provider === 'gitlab') {
    const glAnnotations = formatAnnotations(report.findings, 'gitlab');
    if (glAnnotations.length > 0) {
      writeFileSync('gl-code-quality-report.json', glAnnotations[0]);
    }
  }

  const durationMs = Date.now() - startTime;
  const summary = buildSummary({
    report,
    provider,
    threshold: failOn,
    pass,
    sarifPath: effectiveSarifPath,
    durationMs,
    compliance,
  });

  return {
    pass,
    exitCode: pass ? 0 : 1,
    summary,
  };
}
