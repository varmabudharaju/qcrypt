import { Link } from 'react-router-dom';
import { RiskBadge } from './RiskBadge';
import type { ScanReport } from '../api';

function topRisk(report: ScanReport): 'CRITICAL' | 'WARNING' | 'INFO' | 'OK' {
  if (report.summary.critical > 0) return 'CRITICAL';
  if (report.summary.warning > 0) return 'WARNING';
  if (report.summary.info > 0) return 'INFO';
  return 'OK';
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function ScanTable({ scans }: { scans: ScanReport[] }) {
  if (scans.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 dark:text-[#666666]">
        <p className="text-lg mb-2">No scans yet</p>
        <p className="text-sm">Enter a path above to start your first quantum audit</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#111111] rounded-xl border border-slate-200 dark:border-[#1a1a1a] overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 dark:border-[#1a1a1a]">
            <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 dark:text-[#666666] uppercase">Repository</th>
            <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 dark:text-[#666666] uppercase">Last Scan</th>
            <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 dark:text-[#666666] uppercase">Severity</th>
            <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 dark:text-[#666666] uppercase">Grade</th>
            <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 dark:text-[#666666] uppercase">Action</th>
          </tr>
        </thead>
        <tbody>
          {scans.map((scan) => (
            <tr key={scan.id} className="border-b last:border-0 border-slate-100 dark:border-[#1a1a1a] hover:bg-slate-50 dark:hover:bg-[#1a1a1a] transition-colors">
              <td className="px-5 py-4">
                <p className="font-medium text-slate-800 dark:text-[#e0e0e0] text-sm">{scan.path.split('/').pop() || scan.path}</p>
                <p className="text-xs text-slate-400 dark:text-[#666666]">{scan.path}</p>
              </td>
              <td className="px-5 py-4 text-sm text-slate-500 dark:text-[#666666]">{timeAgo(scan.scannedAt)}</td>
              <td className="px-5 py-4"><RiskBadge risk={topRisk(scan)} /></td>
              <td className="px-5 py-4">
                <span className={`font-bold ${scan.grade === 'A' || scan.grade === 'B' ? 'text-green-500' : scan.grade === 'C' ? 'text-amber-500' : 'text-red-500'}`}>
                  {scan.grade}
                </span>
              </td>
              <td className="px-5 py-4 text-right">
                <Link to={`/scans/${scan.id}`} className="text-sm text-blue-500 dark:text-[#00FF41] hover:underline">
                  View →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
