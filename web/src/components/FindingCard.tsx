import { useState } from 'react';
import { RiskBadge } from './RiskBadge';
import type { Finding } from '../api';

const riskIcons: Record<string, string> = {
  CRITICAL: 'error',
  WARNING: 'warning',
  INFO: 'info',
  OK: 'check_circle',
};

const severityClass: Record<string, string> = {
  CRITICAL: 'severity-critical',
  WARNING: 'severity-warning',
  INFO: 'severity-info',
  OK: 'severity-ok',
};

const usageTypeBadge: Record<string, { dot: string; text: string }> = {
  operation:      { dot: 'bg-error',                text: 'text-error' },
  'key-material': { dot: 'bg-error',                text: 'text-error' },
  config:         { dot: 'bg-tertiary-fixed-dim',   text: 'text-tertiary-fixed-dim' },
  import:         { dot: 'bg-on-surface-variant/40', text: 'text-on-surface-variant/60' },
  reference:      { dot: 'bg-on-surface-variant/40', text: 'text-on-surface-variant/60' },
  comment:        { dot: 'bg-on-surface-variant/20', text: 'text-on-surface-variant/40' },
};

export function FindingCard({ finding }: { finding: Finding }) {
  const [expanded, setExpanded] = useState(false);
  const badge = finding.usageType ? usageTypeBadge[finding.usageType] : null;

  return (
    <div className={`bg-surface-container-low p-4 transition-all ${severityClass[finding.risk] ?? ''}`}>
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
            {riskIcons[finding.risk] ?? 'help'}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-mono text-sm font-semibold text-primary">{finding.algorithm}</p>
              {badge && (
                <span className={`inline-flex items-center gap-1 font-mono text-[10px] tracking-wider uppercase ${badge.text}`}>
                  <span className={`w-1.5 h-1.5 flex-shrink-0 ${badge.dot}`} />
                  {finding.usageType}
                </span>
              )}
            </div>
            <p className="font-mono text-xs text-on-surface-variant">
              {finding.file}:{finding.line}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <RiskBadge risk={finding.risk} />
          <span className="material-symbols-outlined text-[16px] text-on-surface-variant transition-transform"
                style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            expand_more
          </span>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-surface-container-high space-y-3">
          <div>
            <p className="font-mono text-[10px] uppercase text-on-surface-variant tracking-wider mb-1">SOURCE</p>
            <code className="block font-mono text-xs bg-surface-container-lowest p-3 text-on-surface overflow-x-auto">
              {finding.snippet}
            </code>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase text-on-surface-variant tracking-wider mb-1">THREAT ANALYSIS</p>
            <p className="text-sm text-on-surface-variant">{finding.explanation}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase text-on-surface-variant tracking-wider mb-1">REMEDIATION</p>
            <p className="text-sm text-primary-container text-glow-sm">{finding.replacement}</p>
          </div>
        </div>
      )}
    </div>
  );
}
