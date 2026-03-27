import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../theme';
import { scanPath, getScans, type ScanReport } from '../api';
import { StatsCard } from '../components/StatsCard';
import { ScanTable } from '../components/ScanTable';

export function Dashboard() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [path, setPath] = useState('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [scans, setScans] = useState<ScanReport[]>([]);

  useEffect(() => {
    getScans().then(setScans).catch(() => {});
  }, []);

  const handleScan = async () => {
    if (!path.trim()) return;
    setScanning(true);
    setError('');
    try {
      const report = await scanPath(path.trim());
      setScans((prev) => [report, ...prev]);
      navigate(`/scans/${report.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const totalScanned = scans.reduce((acc, s) => acc + s.filesScanned, 0);
  const totalVulnerabilities = scans.reduce((acc, s) => acc + s.summary.critical + s.summary.warning, 0);
  const pqcReadiness = scans.length > 0
    ? Math.round((scans.filter((s) => s.grade === 'A' || s.grade === 'B').length / scans.length) * 100)
    : 100;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-[#e0e0e0]">
          {theme === 'dark' ? 'Initiate Quantum Audit' : 'Security Posture.'}
        </h1>
        <p className="text-slate-500 dark:text-[#666666] mt-1">
          Audit your repositories for Post-Quantum Cryptography readiness.
        </p>
      </div>

      {/* Scan Input */}
      <div className="bg-white dark:bg-[#111111] rounded-xl border border-slate-200 dark:border-[#1a1a1a] p-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleScan()}
            placeholder="/path/to/your/project"
            disabled={scanning}
            className="flex-1 px-4 py-3 rounded-lg border border-slate-300 dark:border-[#2a2a2a] bg-slate-50 dark:bg-[#0a0a0a] text-slate-800 dark:text-[#e0e0e0] placeholder-slate-400 dark:placeholder-[#666666] focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#00FF41] focus:border-transparent text-sm"
          />
          <button
            onClick={handleScan}
            disabled={scanning || !path.trim()}
            className="px-6 py-3 rounded-lg bg-blue-500 dark:bg-[#00FF41] text-white dark:text-black font-semibold text-sm hover:bg-blue-600 dark:hover:bg-[#00dd38] disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {scanning ? 'Scanning...' : 'Scan Repository'}
          </button>
        </div>
        {error && (
          <p className="mt-3 text-sm text-red-500">{error}</p>
        )}
        <p className="mt-2 text-xs text-slate-400 dark:text-[#666666]">
          Supports local directories. Enter an absolute path to scan.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatsCard label="Total Scanned" value={totalScanned.toLocaleString()} />
        <StatsCard label="Vulnerabilities Found" value={totalVulnerabilities} color={totalVulnerabilities > 0 ? 'red' : 'default'} />
        <StatsCard label="PQC Readiness" value={`${pqcReadiness}%`} color="green" />
      </div>

      {/* Recent Scans */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-[#e0e0e0]">Recent Intelligence</h2>
          {scans.length > 0 && (
            <span className="text-sm text-slate-400 dark:text-[#666666]">View all scans</span>
          )}
        </div>
        <ScanTable scans={scans} />
      </div>
    </div>
  );
}
