import path from 'node:path';
import type { AlgorithmCategory } from '../../types.js';

const LANGUAGE_MAP: Record<string, string> = {
  '.js': 'javascript', '.mjs': 'javascript', '.cjs': 'javascript', '.jsx': 'javascript',
  '.ts': 'typescript', '.tsx': 'typescript', '.mts': 'typescript',
  '.py': 'python', '.pyw': 'python',
  '.go': 'go',
  '.rs': 'rust',
  '.java': 'java',
  '.kt': 'kotlin', '.kts': 'kotlin',
};

export function detectLanguage(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return LANGUAGE_MAP[ext] || 'unknown';
}

const DEPENDENCY_MAP: Record<string, Record<string, string[]>> = {
  javascript: { asymmetric: ['@noble/post-quantum'] },
  typescript: { asymmetric: ['@noble/post-quantum'] },
  python: { asymmetric: ['oqs'] },
  go: {
    asymmetric: ['github.com/cloudflare/circl'],
    hash: ['golang.org/x/crypto/sha3'],
  },
  rust: { asymmetric: ['pqcrypto'] },
  java: { asymmetric: ['bcpqc'] },
  kotlin: { asymmetric: ['bcpqc'] },
};

export function getDependencies(language: string, category: AlgorithmCategory): string[] {
  return DEPENDENCY_MAP[language]?.[category] ?? [];
}
