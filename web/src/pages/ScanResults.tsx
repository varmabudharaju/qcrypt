import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getScan, type ScanReport } from '../api';
import { GradeCircle } from '../components/GradeCircle';
import { FindingCard } from '../components/FindingCard';

export function ScanResults() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<ScanReport | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (!id) return;
    getScan(id).then(setReport).catch((err) => setError(err.message));
  }, [id]);

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 text-lg">{error}</p>
        <Link to="/" className="text-blue-500 dark:text-[#00FF41] mt-4 inline-block hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-[#00FF41]" />
      </div>
    );
  }

  const pathName = report.path.split('/').pop() || report.path;
  const filteredFindings = filter === 'all'
    ? report.findings
    : report.findings.filter((f) => f.risk === filter);

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link to="/" className="text-sm text-blue-500 dark:text-[#00FF41] hover:underline">
        ← Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-[#e0e0e0]">{pathName}</h1>
          <p className="text-sm text-slate-400 dark:text-[#666666] mt-1">{report.path}</p>
          <p className="text-xs text-slate-400 dark:text-[#666666] mt-0.5">
            {report.filesScanned} files scanned · {new Date(report.scannedAt).toLocaleString()}
          </p>
        </div>
        <GradeCircle grade={report.grade} />
      </div>

      {/* Severity Cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Critical', count: report.summary.critical, color: 'text-red-500', bg: 'bg-red-500/10' },
          { label: 'Warning', count: report.summary.warning, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Info', count: report.summary.info, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'OK', count: report.summary.ok, color: 'text-green-500', bg: 'bg-green-500/10' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
            <p className={`text-3xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-xs text-slate-500 dark:text-[#666666] mt-1 uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['all', 'CRITICAL', 'WARNING', 'INFO', 'OK'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-blue-500 dark:bg-[#00FF41] text-white dark:text-black'
                : 'bg-slate-100 dark:bg-[#1a1a1a] text-slate-600 dark:text-[#999999] hover:bg-slate-200 dark:hover:bg-[#222222]'
            }`}
          >
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>

      {/* Findings */}
      <div className="space-y-3">
        {filteredFindings.length === 0 ? (
          <div className="text-center py-12 text-slate-400 dark:text-[#666666]">
            <p>No findings matching this filter</p>
          </div>
        ) : (
          filteredFindings.map((finding, i) => (
            <FindingCard key={`${finding.file}-${finding.line}-${i}`} finding={finding} />
          ))
        )}
      </div>

      {/* Remediation Panel */}
      {report.summary.critical > 0 && (
        <div className="bg-slate-800 dark:bg-[#111111] rounded-xl p-6 border border-slate-700 dark:border-[#1a1a1a]">
          <h3 className="text-lg font-bold text-white dark:text-[#e0e0e0] mb-3">
            Post-Quantum Remediation Plan
          </h3>
          <p className="text-sm text-slate-300 dark:text-[#999999] mb-4">
            We recommend transitioning <strong>{pathName}</strong> to ML-KEM (FIPS 203) for key
            encapsulation and ML-DSA (FIPS 204) for digital signatures. This provides 128 bits of security
            against quantum computer cryptanalysis.
          </p>
          <div className="flex gap-4">
            <div className="bg-slate-700 dark:bg-[#0a0a0a] rounded-lg px-4 py-3">
              <p className="text-xs text-slate-400 dark:text-[#666666] uppercase mb-1">Target Primitive</p>
              <p className="text-sm font-semibold text-blue-400 dark:text-[#00FF41]">ML-KEM (Kyber)</p>
            </div>
            <div className="bg-slate-700 dark:bg-[#0a0a0a] rounded-lg px-4 py-3">
              <p className="text-xs text-slate-400 dark:text-[#666666] uppercase mb-1">Migration Path</p>
              <p className="text-sm font-semibold text-blue-400 dark:text-[#00FF41]">Hybrid-Classical</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
