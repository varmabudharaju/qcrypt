import { useState } from 'react';
import { RiskBadge } from './RiskBadge';
import type { Finding } from '../api';

export function FindingCard({ finding }: { finding: Finding }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white dark:bg-[#111111] rounded-xl border border-slate-200 dark:border-[#1a1a1a] p-4 transition-all">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <RiskBadge risk={finding.risk} />
          <div>
            <p className="font-semibold text-slate-800 dark:text-[#e0e0e0]">{finding.algorithm}</p>
            <p className="text-sm text-slate-500 dark:text-[#666666]">
              {finding.file}:{finding.line}
            </p>
          </div>
        </div>
        <button className="text-sm text-blue-500 dark:text-[#00FF41] hover:underline">
          {expanded ? 'Hide' : 'View Details'} →
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#1a1a1a] space-y-3">
          <div>
            <p className="text-xs uppercase text-slate-400 dark:text-[#666666] mb-1">Code</p>
            <code className="block text-sm bg-slate-50 dark:bg-[#0a0a0a] p-3 rounded-lg text-slate-700 dark:text-[#e0e0e0] overflow-x-auto">
              {finding.snippet}
            </code>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-400 dark:text-[#666666] mb-1">Why this is vulnerable</p>
            <p className="text-sm text-slate-600 dark:text-[#999999]">{finding.explanation}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-400 dark:text-[#666666] mb-1">Recommended fix</p>
            <p className="text-sm text-green-600 dark:text-[#00FF41]">{finding.replacement}</p>
          </div>
        </div>
      )}
    </div>
  );
}
