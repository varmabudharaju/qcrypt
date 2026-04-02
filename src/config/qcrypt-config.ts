import { parse } from 'yaml';
import { minimatch } from 'minimatch';
import type { QcryptConfig, EnrichedFinding } from '../types.js';

export function parseQcryptConfig(content: string): QcryptConfig {
  if (!content.trim()) return {};
  try {
    const parsed = parse(content);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as QcryptConfig;
  } catch {
    return {};
  }
}

export function applyConfigOverrides(
  findings: EnrichedFinding[],
  config: QcryptConfig,
): EnrichedFinding[] {
  if (!config.sensitivity) return findings;

  const { high = [], low = [], ignore = [] } = config.sensitivity;

  let result = findings.filter(
    (f) => !ignore.some((pattern) => minimatch(f.file, pattern)),
  );

  result = result.map((f) => {
    if (high.some((pattern) => minimatch(f.file, pattern))) {
      return { ...f, context: { ...f.context, sensitivity: 'high' as const } };
    }
    if (low.some((pattern) => minimatch(f.file, pattern))) {
      return { ...f, context: { ...f.context, sensitivity: 'low' as const } };
    }
    return f;
  });

  return result;
}
