import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { mkdtempSync, rmSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';
import type { Finding, ScanReport } from '../types.js';
import { scanSourceFile } from '../scanners/source-code.js';
import { scanDependencyFile } from '../scanners/dependencies.js';
import { scanConfigFile } from '../scanners/config-files.js';
import { scanCertificateFile } from '../scanners/certificates.js';
import { getLanguagePatterns } from '../rules/patterns.js';
import { gradeFromScore, computeUsageBreakdown, computeQuantumSummary } from '../index.js';
import { enrichFindings } from '../analyzers/context.js';
import { computeReadinessScore } from '../analyzers/readiness.js';

const GITHUB_API = 'https://api.github.com';

const CERT_EXTENSIONS = new Set(['.pem', '.crt', '.cer', '.key', '.pub']);
const DEP_BASENAMES = new Set([
  'package.json', 'requirements.txt', 'Pipfile',
  'go.mod', 'go.sum', 'Cargo.toml',
]);
const CONFIG_BASENAMES = new Set([
  'nginx.conf', 'httpd.conf', 'apache2.conf',
  'sshd_config', 'ssh_config', 'openssl.cnf',
  'haproxy.cfg',
]);
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '__pycache__', 'vendor', 'target', '.next', '.nuxt']);

interface ParsedUrl {
  owner: string;
  repo: string;
  ref: string;
  subdir: string;
}

export function isGitHubUrl(input: string): boolean {
  const normalized = input.replace(/^https?:\/\//, '');
  return normalized.startsWith('github.com/') || /^\w[\w.-]*\/\w[\w.-]*$/.test(input);
}

export function parseGitHubUrl(input: string): ParsedUrl {
  let normalized = input.replace(/^https?:\/\//, '').replace(/^github\.com\//, '');
  normalized = normalized.replace(/\.git$/, '').replace(/\/$/, '');

  const parts = normalized.split('/');
  const owner = parts[0];
  const repo = parts[1];

  if (!owner || !/^[\w.-]+$/.test(owner)) {
    throw new Error(`Invalid GitHub owner: "${owner}"`);
  }
  if (!repo || !/^[\w.-]+$/.test(repo)) {
    throw new Error(`Invalid GitHub repository: "${repo}"`);
  }

  let ref = 'HEAD';
  let subdir = '';
  if (parts.length > 2 && parts[2] === 'tree') {
    ref = parts[3] || 'HEAD';
    subdir = parts.slice(4).join('/');
  }

  return { owner, repo, ref, subdir };
}

// ── Tarball approach (1 API call) ──

async function downloadTarball(owner: string, repo: string, ref: string, token?: string): Promise<string> {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/tarball/${ref}`;
  const headers: Record<string, string> = {
    'User-Agent': 'qcrypt-scan/0.2.0',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { headers, redirect: 'follow', signal: AbortSignal.timeout(30_000) });

  if (res.status === 404) {
    throw new Error(`Repository not found: ${owner}/${repo}. Check the URL and ensure the repo is public.`);
  }
  if (res.status === 403) {
    throw new Error(
      'GitHub API rate limit exceeded. ' +
      (token ? 'Your token has hit the limit.' : 'Set GITHUB_TOKEN env var for higher limits.')
    );
  }
  if (!res.ok) {
    throw new Error(`GitHub tarball download failed: ${res.status} ${res.statusText}`);
  }

  // Write tarball to temp file, extract to temp dir
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'qcrypt-'));
  const tarballPath = path.join(tmpDir, 'repo.tar.gz');

  const buffer = Buffer.from(await res.arrayBuffer());
  const { writeFileSync } = await import('node:fs');
  writeFileSync(tarballPath, buffer);

  // Extract
  const extractDir = path.join(tmpDir, 'extracted');
  const { mkdirSync } = await import('node:fs');
  mkdirSync(extractDir, { recursive: true });
  execSync(`tar -xzf "${tarballPath}" -C "${extractDir}" --strip-components=1`, { stdio: 'ignore' });

  return extractDir;
}

function classifyFile(filePath: string): 'source' | 'cert' | 'config' | 'dep' | 'skip' {
  const basename = path.basename(filePath);
  const ext = path.extname(filePath);

  const parts = filePath.split('/');
  if (parts.some((p) => SKIP_DIRS.has(p))) return 'skip';

  if (DEP_BASENAMES.has(basename)) return 'dep';
  if (CONFIG_BASENAMES.has(basename)) return 'config';
  if (CERT_EXTENSIONS.has(ext)) return 'cert';
  if (getLanguagePatterns(ext)) return 'source';

  return 'skip';
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_DEPTH = 50;

function discoverFiles(dir: string): string[] {
  const files: string[] = [];
  function walk(currentDir: string, depth: number) {
    if (depth > MAX_DEPTH) return;
    let entries;
    try {
      entries = readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const fullPath = path.join(currentDir, entry.name);
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

function scanExtractedRepo(repoDir: string, subdir: string, displayBase: string): { findings: Finding[]; filesScanned: number; languageCoverage?: { scanned: number; skipped: number; unsupportedExtensions: { ext: string; count: number }[] } } {
  const scanRoot = subdir ? path.join(repoDir, subdir) : repoDir;

  // Prevent path traversal via crafted subdir
  const resolvedRoot = path.resolve(scanRoot);
  const resolvedRepo = path.resolve(repoDir);
  if (!resolvedRoot.startsWith(resolvedRepo + path.sep) && resolvedRoot !== resolvedRepo) {
    throw new Error('Invalid subdirectory path');
  }

  let allFiles: string[];
  try {
    allFiles = discoverFiles(scanRoot);
  } catch {
    throw new Error(`Subdirectory "${subdir}" not found in repository.`);
  }

  const allFindings: Finding[] = [];
  let scannedCount = 0;
  let skippedCount = 0;
  const extCounts: Record<string, number> = {};

  for (const file of allFiles) {
    const relativePath = path.relative(repoDir, file);
    const type = classifyFile(relativePath);
    if (type === 'skip') {
      skippedCount++;
      const ext = path.extname(file).toLowerCase();
      if (ext) extCounts[ext] = (extCounts[ext] ?? 0) + 1;
      continue;
    }

    let content: string;
    try {
      content = readFileSync(file, 'utf-8');
    } catch {
      continue;
    }

    scannedCount++;
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

  const unsupportedExtensions = Object.entries(extCounts)
    .filter(([ext]) => ['.c', '.h', '.cpp', '.cc', '.hpp', '.rb', '.php', '.swift', '.m', '.mm', '.cs', '.scala', '.zig'].includes(ext))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([ext, count]) => ({ ext, count }));

  return {
    findings: allFindings,
    filesScanned: scannedCount,
    languageCoverage: skippedCount > 0 ? { scanned: scannedCount, skipped: skippedCount, unsupportedExtensions } : undefined,
  };
}

export async function scanGitHubRepo(url: string, token?: string): Promise<ScanReport> {
  const { owner, repo, ref, subdir } = parseGitHubUrl(url);
  const displayBase = `github.com/${owner}/${repo}${subdir ? '/' + subdir : ''}`;

  // Download tarball (1 API call) and extract locally
  const repoDir = await downloadTarball(owner, repo, ref, token);

  try {
    const { findings: allFindings, filesScanned, languageCoverage } = scanExtractedRepo(repoDir, subdir, displayBase);

    // Sort by risk
    const riskOrder: Record<string, number> = { CRITICAL: 0, WARNING: 1, INFO: 2, OK: 3 };
    allFindings.sort((a, b) => riskOrder[a.risk] - riskOrder[b.risk]);

    const summary = {
      critical: allFindings.filter((f) => f.risk === 'CRITICAL').length,
      warning: allFindings.filter((f) => f.risk === 'WARNING').length,
      info: allFindings.filter((f) => f.risk === 'INFO').length,
      ok: allFindings.filter((f) => f.risk === 'OK').length,
    };

    const enrichedFindings = enrichFindings(allFindings);
    const readiness = computeReadinessScore(enrichedFindings, filesScanned);
    const grade = gradeFromScore(readiness.overall);

    return {
      id: randomUUID(),
      path: displayBase,
      scannedAt: new Date().toISOString(),
      filesScanned,
      findings: allFindings,
      enrichedFindings,
      summary,
      usageBreakdown: computeUsageBreakdown(allFindings),
      grade,
      readiness,
      quantumSummary: computeQuantumSummary(allFindings),
      languageCoverage,
    };
  } finally {
    // Clean up temp directory
    try {
      rmSync(path.dirname(repoDir), { recursive: true, force: true });
    } catch {
      // Best effort cleanup
    }
  }
}
