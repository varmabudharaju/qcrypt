import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getScans, type ScanReport } from '../api';
import { StatsCard } from '../components/StatsCard';

const gradeColors: Record<string, string> = {
  A: 'text-green-500', B: 'text-green-400', C: 'text-amber-500', D: 'text-red-400', F: 'text-red-500',
};

export function Leaderboard() {
  const [scans, setScans] = useState<ScanReport[]>([]);

  useEffect(() => {
    getScans().then(setScans).catch(() => {});
  }, []);

  const totalFiles = scans.reduce((acc, s) => acc + s.filesScanned, 0);
  const totalVulnerable = scans.reduce((acc, s) => acc + s.summary.critical + s.summary.warning, 0);
  const pqcTransitions = scans.reduce((acc, s) => acc + s.summary.ok, 0);
  const overallScore = scans.length > 0
    ? (scans.filter((s) => s.grade === 'A' || s.grade === 'B').length / scans.length * 100).toFixed(1)
    : '100.0';

  // Sort scans by grade (A first), then by critical count (ascending)
  const ranked = [...scans].sort((a, b) => {
    const gradeOrder = { A: 0, B: 1, C: 2, D: 3, F: 4 };
    const gDiff = (gradeOrder[a.grade] ?? 5) - (gradeOrder[b.grade] ?? 5);
    if (gDiff !== 0) return gDiff;
    return a.summary.critical - b.summary.critical;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400 dark:text-[#666666] uppercase tracking-wider mb-1">
            State of the Ecosystem
          </p>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-[#e0e0e0]">
            Global OSS Readiness Index
          </h1>
          <p className="text-slate-500 dark:text-[#666666] mt-2 max-w-xl">
            An aggregated real-time metric measuring the collective resistance of scanned
            projects against Post-Quantum Cryptographic (PQC) threats.
          </p>
        </div>
        <div className="text-right">
          <p className="text-5xl font-bold text-blue-500 dark:text-[#00FF41]">{overallScore}<span className="text-2xl">%</span></p>
          <p className="text-xs text-slate-400 dark:text-[#666666] mt-1">Overall Readiness</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatsCard label="Active Scans" value={scans.length} />
        <StatsCard label="Quantum Vulnerable Items" value={totalVulnerable} color={totalVulnerable > 0 ? 'red' : 'default'} />
        <StatsCard label="PQC Transitions" value={pqcTransitions} color="green" />
      </div>

      {/* Rankings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-[#e0e0e0]">Ecosystem Rankings</h2>
        </div>

        {ranked.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-[#111111] rounded-xl border border-slate-200 dark:border-[#1a1a1a]">
            <p className="text-slate-400 dark:text-[#666666] text-lg mb-2">No scans yet</p>
            <p className="text-sm text-slate-400 dark:text-[#666666] mb-4">Scan some projects to see them ranked here</p>
            <Link to="/" className="text-blue-500 dark:text-[#00FF41] hover:underline text-sm">
              Go to Dashboard →
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#111111] rounded-xl border border-slate-200 dark:border-[#1a1a1a] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[#1a1a1a]">
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 dark:text-[#666666] uppercase w-12">#</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 dark:text-[#666666] uppercase">Repository</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 dark:text-[#666666] uppercase">Total Scanned</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 dark:text-[#666666] uppercase">PQC Compliance</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 dark:text-[#666666] uppercase">Readiness Grade</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((scan, i) => {
                  const total = scan.summary.critical + scan.summary.warning + scan.summary.info + scan.summary.ok;
                  const compliance = total > 0 ? Math.round((scan.summary.ok / total) * 100) : 100;
                  return (
                    <tr key={scan.id} className="border-b last:border-0 border-slate-100 dark:border-[#1a1a1a] hover:bg-slate-50 dark:hover:bg-[#1a1a1a] transition-colors">
                      <td className="px-5 py-4 text-sm text-slate-400 dark:text-[#666666] font-mono">
                        {String(i + 1).padStart(2, '0')}
                      </td>
                      <td className="px-5 py-4">
                        <Link to={`/scans/${scan.id}`} className="font-medium text-slate-800 dark:text-[#e0e0e0] text-sm hover:underline">
                          {scan.path.split('/').pop() || scan.path}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500 dark:text-[#666666]">
                        {scan.filesScanned.toLocaleString()}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-slate-200 dark:bg-[#1a1a1a] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 dark:bg-[#00FF41] rounded-full transition-all"
                              style={{ width: `${compliance}%` }}
                            />
                          </div>
                          <span className="text-sm text-slate-500 dark:text-[#666666]">{compliance}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`font-bold text-lg ${gradeColors[scan.grade] ?? 'text-slate-500'}`}>
                          Grade {scan.grade}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="bg-white dark:bg-[#111111] rounded-xl border border-slate-200 dark:border-[#1a1a1a] p-8 text-center">
        <h3 className="text-2xl font-bold text-slate-800 dark:text-[#e0e0e0] mb-2">
          Is your project quantum-ready?
        </h3>
        <p className="text-slate-500 dark:text-[#666666] mb-6 max-w-lg mx-auto">
          Join the leaderboard and demonstrate your commitment to long-term security. Scan
          your repository for free and get a detailed PQC compliance report in minutes.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            to="/"
            className="px-6 py-3 rounded-lg bg-blue-500 dark:bg-[#00FF41] text-white dark:text-black font-semibold text-sm hover:bg-blue-600 dark:hover:bg-[#00dd38] transition-colors"
          >
            Scan My Repo
          </Link>
          <a
            href="https://csrc.nist.gov/projects/post-quantum-cryptography"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-lg border border-slate-300 dark:border-[#2a2a2a] text-slate-600 dark:text-[#999999] font-semibold text-sm hover:bg-slate-50 dark:hover:bg-[#1a1a1a] transition-colors"
          >
            Learn about PQC
          </a>
        </div>
      </div>
    </div>
  );
}
