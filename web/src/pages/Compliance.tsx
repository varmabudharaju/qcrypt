import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getComplianceFrameworks, getProjects, assessCompliance } from '../api';
import type { ComplianceFramework, ComplianceAssessment, ProjectWithLatestScan, FullComplianceReport } from '../api';

const STATUS_STYLES: Record<string, string> = {
  pass: 'bg-primary-container/15 text-primary-container',
  fail: 'bg-error-container/40 text-error',
  warning: 'bg-tertiary-fixed-dim/20 text-tertiary-fixed-dim',
};

const FRAMEWORK_ICONS: Record<string, string> = {
  'cnsa-2.0': 'security',
  'fips-140-3': 'shield',
  'nist-sp-800-208': 'policy',
  'pci-dss-4.0': 'credit_card',
};

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadJson(data: unknown, filename: string) {
  downloadFile(JSON.stringify(data, null, 2), filename, 'application/json');
}

function esc(s: string) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

function downloadComplianceHtml(report: FullComplianceReport) {
  const date = new Date().toISOString().split('T')[0];
  const statusColor = (s: string) => s === 'pass' ? '#39ff14' : s === 'fail' ? '#ffb4ab' : '#fbbf24';

  const cards = report.assessments.map(a => {
    const total = a.summary.total || 1;
    const score = Math.round((a.summary.compliant / total) * 100);
    return `
    <div class="card">
      <div class="card-head">
        <div><strong>${esc(a.framework.name)}</strong><br><span class="dim">${esc(a.framework.version)}</span></div>
        <span class="badge" style="background:${statusColor(a.status)}20;color:${statusColor(a.status)}">${a.status.toUpperCase()}</span>
      </div>
      <p class="desc">${esc(a.framework.description)}</p>
      <div class="bar-wrap"><div class="bar-label">COMPLIANCE: ${score}%</div><div class="bar"><div class="bar-fill" style="width:${score}%;background:${statusColor(a.status)}"></div></div></div>
      <div class="counts">
        <span style="color:#39ff14">${a.summary.compliant} COMPLIANT</span>
        <span style="color:#ffb4ab">${a.summary.nonCompliant} NON-COMPLIANT</span>
        <span style="color:#fbbf24">${a.summary.deprecated} DEPRECATED</span>
      </div>
      ${a.framework.deadline ? `<div class="deadline">DEADLINE: ${esc(a.framework.deadline)}</div>` : ''}
    </div>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>Compliance Report — ${date}</title>
<style>
  :root{--bg:#131318;--s:#1b1b20;--t:#e4e1e9;--d:#baccb0;--a:#39ff14}
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:var(--bg);color:var(--t);font-family:'Space Grotesk',system-ui,sans-serif;font-size:14px;padding:3rem 2rem;max-width:1100px;margin:0 auto}
  h1{font-size:2rem;color:var(--a);margin-bottom:.5rem;letter-spacing:-.02em}
  .sub{font-size:10px;color:var(--d);text-transform:uppercase;letter-spacing:.15em;margin-bottom:2rem;font-family:'JetBrains Mono',monospace}
  .overall{padding:1rem;background:var(--s);margin-bottom:2rem;font-family:'JetBrains Mono',monospace;font-size:13px;display:flex;align-items:center;gap:1rem}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:2px}
  .card{background:var(--s);padding:1.25rem}
  .card-head{display:flex;justify-content:space-between;align-items:start;margin-bottom:.75rem;font-family:'JetBrains Mono',monospace;font-size:13px}
  .desc{font-size:12px;color:var(--d);margin-bottom:.75rem}
  .badge{display:inline-block;padding:2px 8px;font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700}
  .bar-wrap{margin-bottom:.75rem}
  .bar-label{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--d);margin-bottom:4px}
  .bar{height:6px;background:#35343a}
  .bar-fill{height:100%}
  .counts{font-family:'JetBrains Mono',monospace;font-size:10px;display:flex;gap:1rem}
  .deadline{margin-top:.75rem;padding-top:.75rem;border-top:1px solid #35343a;font-family:'JetBrains Mono',monospace;font-size:10px;color:#fbbf24}
  .dim{font-size:10px;color:var(--d)}
  @media print{body{background:#fff;color:#000}.card{background:#f5f5f5;border:1px solid #ddd}}
</style></head><body>
<h1>COMPLIANCE ASSESSMENT</h1>
<div class="sub">Generated ${date} // Scan ${report.scanId}</div>
<div class="overall">
  <span class="badge" style="background:${statusColor(report.overallStatus)}20;color:${statusColor(report.overallStatus)}">${report.overallStatus.toUpperCase()}</span>
  <span>${report.blockingCount} blocking issue${report.blockingCount !== 1 ? 's' : ''}</span>
</div>
<div class="grid">${cards}</div>
<p style="margin-top:2rem;font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--d);text-transform:uppercase;letter-spacing:.1em">
  Generated by qcrypt-scan v0.2.0 // Print (CMD+P) for PDF
</p></body></html>`;

  downloadFile(html, `compliance-report-${date}.html`, 'text/html');
}

export function Compliance() {
  const [searchParams] = useSearchParams();
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([]);
  const [fullReport, setFullReport] = useState<FullComplianceReport | null>(null);
  const [assessments, setAssessments] = useState<ComplianceAssessment[]>([]);
  const [projects, setProjects] = useState<ProjectWithLatestScan[]>([]);
  const [selectedScanId, setSelectedScanId] = useState<string>(searchParams.get('scanId') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getComplianceFrameworks().then(setFrameworks).catch((e) => setError(e instanceof Error ? e.message : 'Failed to load frameworks'));
    getProjects().then((p) => {
      setProjects(p);
      // Auto-select from URL param or first available scan
      const paramScanId = searchParams.get('scanId');
      if (paramScanId) {
        setSelectedScanId(paramScanId);
      } else {
        const firstWithScan = p.find((proj) => proj.latestScan);
        if (firstWithScan?.latestScan) {
          setSelectedScanId(firstWithScan.latestScan.id);
        }
      }
    }).catch((e) => setError(e instanceof Error ? e.message : 'Failed to load projects'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedScanId) return;
    setLoading(true);
    setError('');
    assessCompliance(selectedScanId)
      .then((report) => {
        setFullReport(report);
        setAssessments(report.assessments);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Assessment failed'))
      .finally(() => setLoading(false));
  }, [selectedScanId]);

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-[10px] text-on-surface-variant tracking-[0.3em] uppercase mb-2">
            REGULATORY COMPLIANCE MODULE
          </p>
          <h1 className="font-headline text-3xl font-bold text-primary uppercase tracking-tight">
            COMPLIANCE ASSESSMENT
          </h1>
          <p className="text-on-surface-variant mt-2 max-w-xl">
            Evaluate your cryptographic posture against major post-quantum compliance frameworks and regulatory deadlines.
          </p>
        </div>
        {fullReport && (
          <div className="flex gap-2">
            <button
              onClick={() => downloadJson(fullReport, `compliance-report-${new Date().toISOString().split('T')[0]}.json`)}
              className="px-4 py-2 font-mono text-xs font-bold text-primary-container bg-surface-container hover:bg-surface-container-high transition-colors inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">data_object</span>
              JSON
            </button>
            <button
              onClick={() => downloadComplianceHtml(fullReport)}
              className="btn-neon px-4 py-2 text-xs inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">description</span>
              HTML
            </button>
          </div>
        )}
      </div>

      {/* Project selector */}
      <div className="bg-surface-container-low p-5">
        <p className="font-mono text-[10px] text-on-surface-variant tracking-wider uppercase mb-2">SELECT SCAN TARGET</p>
        <div className="flex flex-wrap gap-2">
          {projects.filter((p) => p.latestScan).map((proj) => (
            <button
              key={proj.id}
              onClick={() => setSelectedScanId(proj.latestScan!.id)}
              className={`px-3 py-1.5 font-mono text-[10px] transition-colors ${
                selectedScanId === proj.latestScan!.id
                  ? 'bg-primary-container text-on-primary font-bold'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-primary'
              }`}
            >
              {proj.name} ({proj.latestScan!.grade})
            </button>
          ))}
        </div>
        {error && <p className="font-mono text-xs text-error mt-2">{error}</p>}
      </div>

      {/* Overall status */}
      {fullReport && (
        <div className="flex items-center gap-4 bg-surface-container-low p-4">
          <span className={`font-mono text-xs font-bold px-3 py-1 ${STATUS_STYLES[fullReport.overallStatus] ?? STATUS_STYLES['warning']}`}>
            {fullReport.overallStatus.toUpperCase()}
          </span>
          <span className="font-mono text-xs text-on-surface-variant">
            {fullReport.blockingCount} blocking issue{fullReport.blockingCount !== 1 ? 's' : ''} across all frameworks
          </span>
        </div>
      )}

      {/* Framework cards */}
      <div>
        <h2 className="font-mono text-xs text-on-surface-variant tracking-[0.2em] uppercase mb-3">
          COMPLIANCE FRAMEWORKS
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-12 bg-surface-container-low">
            <div className="w-6 h-6 border-2 border-primary-container border-t-transparent animate-spin" />
            <span className="font-mono text-xs text-on-surface-variant ml-3 tracking-wider">ASSESSING...</span>
          </div>
        ) : assessments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-surface-container-high">
            {assessments.map((assessment) => {
              const iconName = FRAMEWORK_ICONS[assessment.framework.id] ?? 'verified_user';
              const total = assessment.summary.total || 1;
              const score = Math.round((assessment.summary.compliant / total) * 100);
              return (
                <div key={assessment.framework.id} className="bg-surface-container-low p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[24px] text-primary-container">{iconName}</span>
                      <div>
                        <p className="font-mono text-sm font-bold text-primary">{assessment.framework.name}</p>
                        <p className="font-mono text-[10px] text-on-surface-variant/50">{assessment.framework.version}</p>
                      </div>
                    </div>
                    <span className={`font-mono text-[10px] font-bold px-2 py-0.5 tracking-wider uppercase ${STATUS_STYLES[assessment.status] ?? STATUS_STYLES['warning']}`}>
                      {assessment.status}
                    </span>
                  </div>

                  <p className="text-xs text-on-surface-variant mb-4">{assessment.framework.description}</p>

                  {/* Score bar */}
                  <div className="mb-3">
                    <div className="flex justify-between mb-1">
                      <span className="font-mono text-[10px] text-on-surface-variant">COMPLIANCE</span>
                      <span className="font-mono text-[10px] text-primary-container">{score}%</span>
                    </div>
                    <div className="h-1.5 bg-surface-container-highest">
                      <div
                        className={`h-full transition-all duration-500 ${
                          assessment.status === 'pass' ? 'bg-primary-container' :
                          assessment.status === 'fail' ? 'bg-error' : 'bg-tertiary-fixed-dim'
                        }`}
                        style={{ width: `${Math.min(100, score)}%` }}
                      />
                    </div>
                  </div>

                  {/* Counts */}
                  <div className="flex gap-4 font-mono text-[10px]">
                    <span className="text-primary-container">{assessment.summary.compliant} COMPLIANT</span>
                    <span className="text-error">{assessment.summary.nonCompliant} NON-COMPLIANT</span>
                    <span className="text-tertiary-fixed-dim">{assessment.summary.deprecated} DEPRECATED</span>
                  </div>

                  {assessment.framework.deadline && (
                    <div className="mt-3 pt-3 border-t border-surface-container-high">
                      <span className="font-mono text-[10px] text-tertiary-fixed-dim">
                        DEADLINE: {assessment.framework.deadline}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : frameworks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-surface-container-high">
            {frameworks.map((fw) => {
              const iconName = FRAMEWORK_ICONS[fw.id] ?? 'verified_user';
              return (
                <div key={fw.id} className="bg-surface-container-low p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="material-symbols-outlined text-[24px] text-on-surface-variant/40">{iconName}</span>
                    <div>
                      <p className="font-mono text-sm font-bold text-primary">{fw.name}</p>
                      <p className="font-mono text-[10px] text-on-surface-variant/50">{fw.version}</p>
                    </div>
                  </div>
                  <p className="text-xs text-on-surface-variant mb-3">{fw.description}</p>
                  {fw.deadline && (
                    <span className="font-mono text-[10px] text-tertiary-fixed-dim">
                      DEADLINE: {fw.deadline}
                    </span>
                  )}
                  <p className="font-mono text-[10px] text-on-surface-variant/40 mt-2">
                    Select a scan target to assess compliance
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-surface-container-low p-8 text-center">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/20">verified_user</span>
            <p className="font-mono text-xs text-on-surface-variant mt-4">
              Select a project scan to begin assessment
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
