import type { EnrichedFinding, DimensionScore } from '../types.js';

const WEIGHT = 0.15;

export function computeAgilityScore(findings: EnrichedFinding[]): DimensionScore {
  const uniqueFiles = new Set(findings.map((f) => f.file));
  const count = uniqueFiles.size;

  let score: number;
  let details: string;

  if (count <= 2) {
    score = 100;
    details = `Crypto centralized in ${count} file(s) — excellent agility`;
  } else if (count <= 5) {
    score = 75;
    details = `Crypto in ${count} files — good centralization`;
  } else if (count <= 10) {
    score = 50;
    details = `Crypto in ${count} files — moderate spread`;
  } else if (count <= 20) {
    score = 25;
    details = `Crypto in ${count} files — scattered, migration will be harder`;
  } else {
    score = 10;
    details = `Crypto in ${count} files — highly scattered, consider centralizing`;
  }

  return {
    score,
    weighted: Math.round(score * WEIGHT * 100) / 100,
    details,
  };
}
