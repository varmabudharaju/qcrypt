import { readFileSync, readdirSync, statSync, lstatSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import type { Finding, ScanReport, UsageType, QuantumSummary, QuantumThreatEntry } from './types.js';
import { getQuantumEstimate, getWeakestThreat } from './reference/quantum-estimates.js';
import { scanSourceFile } from './scanners/source-code.js';
import { scanCertificateFile } from './scanners/certificates.js';
import { scanConfigFile } from './scanners/config-files.js';
import { scanDependencyFile } from './scanners/dependencies.js';
import { getLanguagePatterns } from './rules/patterns.js';
import { enrichFindings } from './analyzers/context.js';
import { computeReadinessScore } from './analyzers/readiness.js';
import { parseQcryptConfig, applyConfigOverrides } from './config/qcrypt-config.js';
import { isGitHubUrl, scanGitHubRepo } from './github/scanner.js';

const CERT_EXTENSIONS = new Set(['.pem', '.crt', '.cer', '.key', '.pub']);
const CONFIG_BASENAMES = new Set([
  'nginx.conf', 'httpd.conf', 'apache2.conf',
  'sshd_config', 'ssh_config',
  'openssl.cnf', 'openssl.conf',
  'haproxy.cfg',
]);
const DEP_BASENAMES = new Set([
  'package.json', 'requirements.txt', 'Pipfile',
  'go.mod', 'go.sum', 'Cargo.toml',
]);
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '__pycache__', 'vendor', 'target']);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_DEPTH = 50;

function discoverFiles(dir: string): string[] {
  const files: string[] = [];

  function walk(currentDir: string, depth: number) {
    if (depth > MAX_DEPTH) return;
    const entries = readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const fullPath = path.join(currentDir, entry.name);
      // Skip symlinks to prevent traversal and loops
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        walk(fullPath, depth + 1);
      } else if (entry.isFile()) {
        try {
          const stat = statSync(fullPath);
          if (stat.size <= MAX_FILE_SIZE) {
            files.push(fullPath);
          }
        } catch {
          continue;
        }
      }
    }
  }

  walk(dir, 0);
  return files;
}

function classifyFile(filePath: string): 'source' | 'cert' | 'config' | 'dep' | 'skip' {
  const ext = path.extname(filePath);
  const basename = path.basename(filePath);

  if (DEP_BASENAMES.has(basename)) return 'dep';
  if (CONFIG_BASENAMES.has(basename)) return 'config';
  if (CERT_EXTENSIONS.has(ext)) return 'cert';
  if (getLanguagePatterns(ext)) return 'source';

  return 'skip';
}

export function computeUsageBreakdown(findings: Finding[]) {
  const counts = { operations: 0, imports: 0, keyMaterial: 0, config: 0, references: 0, comments: 0 };
  const typeMap: Record<UsageType, keyof typeof counts> = {
    'operation': 'operations',
    'import': 'imports',
    'key-material': 'keyMaterial',
    'config': 'config',
    'reference': 'references',
    'comment': 'comments',
  };
  for (const f of findings) {
    counts[typeMap[f.usageType]]++;
  }
  return counts;
}

export function computeQuantumSummary(findings: Finding[]): QuantumSummary {
  const uniqueAlgos = [...new Set(findings.map((f) => f.algorithm))];
  const threats: QuantumThreatEntry[] = [];
  const seenEstimates = new Set<string>();

  for (const algo of uniqueAlgos) {
    const est = getQuantumEstimate(algo);
    if (!est || seenEstimates.has(est.algorithm)) continue;
    seenEstimates.add(est.algorithm);
    threats.push({
      algorithm: est.algorithm,
      classicalBreakTime: est.classicalBreakTime,
      quantumBreakTime: est.quantumBreakTime,
      quantumAlgorithm: est.quantumAlgorithm,
      speedup: est.speedup,
      qubitsRequired: est.qubitsRequired,
      threatLevel: est.threatLevel,
      citation: est.citation,
    });
  }

  const weakest = getWeakestThreat(uniqueAlgos);
  const weakestLink = weakest ? {
    algorithm: weakest.algorithm,
    classicalBreakTime: weakest.classicalBreakTime,
    quantumBreakTime: weakest.quantumBreakTime,
    quantumAlgorithm: weakest.quantumAlgorithm,
    speedup: weakest.speedup,
    qubitsRequired: weakest.qubitsRequired,
    threatLevel: weakest.threatLevel,
    citation: weakest.citation,
  } : null;

  return { weakestLink, threats };
}

export function gradeFromScore(overall: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (overall >= 90) return 'A';
  if (overall >= 70) return 'B';
  if (overall >= 50) return 'C';
  if (overall >= 30) return 'D';
  return 'F';
}

export async function scan(targetPath: string): Promise<ScanReport> {
  // GitHub URL support
  if (isGitHubUrl(targetPath)) {
    return scanGitHubRepo(targetPath, process.env.GITHUB_TOKEN);
  }

  const resolvedPath = path.resolve(targetPath);
  const stat = statSync(resolvedPath);

  let files: string[];
  if (stat.isDirectory()) {
    files = discoverFiles(resolvedPath);
  } else {
    files = [resolvedPath];
  }

  const allFindings: Finding[] = [];

  // Track language coverage
  const extCounts: Record<string, number> = {};
  let scannedCount = 0;
  let skippedCount = 0;

  for (const file of files) {
    const type = classifyFile(file);
    if (type === 'skip') {
      skippedCount++;
      const ext = path.extname(file).toLowerCase();
      if (ext) extCounts[ext] = (extCounts[ext] ?? 0) + 1;
      continue;
    }
    scannedCount++;

    let content: string;
    try {
      content = readFileSync(file, 'utf-8');
    } catch {
      continue;
    }

    const relativePath = path.relative(resolvedPath, file) || path.basename(file);
    let findings: Finding[];

    switch (type) {
      case 'source':
        findings = scanSourceFile(relativePath, content);
        break;
      case 'cert':
        findings = scanCertificateFile(relativePath, content);
        break;
      case 'config':
        findings = scanConfigFile(relativePath, content);
        break;
      case 'dep':
        findings = scanDependencyFile(relativePath, content);
        break;
      default:
        findings = [];
    }

    allFindings.push(...findings);
  }

  const riskOrder: Record<string, number> = { CRITICAL: 0, WARNING: 1, INFO: 2, OK: 3 };
  allFindings.sort((a, b) => riskOrder[a.risk] - riskOrder[b.risk]);

  const summary = {
    critical: allFindings.filter((f) => f.risk === 'CRITICAL').length,
    warning: allFindings.filter((f) => f.risk === 'WARNING').length,
    info: allFindings.filter((f) => f.risk === 'INFO').length,
    ok: allFindings.filter((f) => f.risk === 'OK').length,
  };

  // Enrich findings with context
  let enrichedFindings = enrichFindings(allFindings);

  // Load .qcrypt.yml if present
  const configPath = stat.isDirectory()
    ? path.join(resolvedPath, '.qcrypt.yml')
    : path.join(path.dirname(resolvedPath), '.qcrypt.yml');
  try {
    const configContent = readFileSync(configPath, 'utf-8');
    const config = parseQcryptConfig(configContent);
    enrichedFindings = applyConfigOverrides(enrichedFindings, config);
  } catch {
    // No config file — use defaults
  }

  // Compute readiness score
  const readiness = computeReadinessScore(enrichedFindings, files.length);
  const grade = gradeFromScore(readiness.overall);

  return {
    id: randomUUID(),
    path: targetPath,
    scannedAt: new Date().toISOString(),
    filesScanned: files.length,
    findings: allFindings,
    enrichedFindings,
    summary,
    usageBreakdown: computeUsageBreakdown(allFindings),
    grade,
    readiness,
    quantumSummary: computeQuantumSummary(allFindings),
    languageCoverage: skippedCount > 0 ? {
      scanned: scannedCount,
      skipped: skippedCount,
      unsupportedExtensions: Object.entries(extCounts)
        .filter(([ext]) => ['.c', '.h', '.cpp', '.cc', '.hpp', '.rb', '.php', '.swift', '.m', '.mm', '.cs', '.scala', '.zig'].includes(ext))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([ext, count]) => ({ ext, count })),
    } : undefined,
  };
}
