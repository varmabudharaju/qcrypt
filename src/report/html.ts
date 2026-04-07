// src/report/html.ts
import type { ScanReport, Finding, MigrationPlan, MigrationStep } from '../types.js';
import type { FullComplianceReport } from '../compliance/index.js';

interface ReportInput {
  scanReport: ScanReport;
  migrationPlan: MigrationPlan;
  complianceReport: FullComplianceReport;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function riskColor(risk: string): string {
  switch (risk) {
    case 'CRITICAL': return '#ffb4ab';
    case 'WARNING': return '#fbbf24';
    case 'INFO': return '#60a5fa';
    case 'OK': return '#39ff14';
    default: return '#baccb0';
  }
}

function statusColor(status: string): string {
  switch (status) {
    case 'pass': return '#39ff14';
    case 'fail': return '#ffb4ab';
    case 'warning': return '#fbbf24';
    default: return '#baccb0';
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'pass': return 'COMPLIANT';
    case 'fail': return 'NON-COMPLIANT';
    case 'warning': return 'WARNINGS';
    default: return status.toUpperCase();
  }
}

function gradeColor(grade: string): string {
  switch (grade) {
    case 'A': return '#39ff14';
    case 'B': return '#72de58';
    case 'C': return '#fbbf24';
    case 'D': return '#fb923c';
    case 'F': return '#ffb4ab';
    default: return '#baccb0';
  }
}

function priorityLabel(p: string): string {
  switch (p) {
    case 'immediate': return 'IMMEDIATE';
    case 'short-term': return 'SHORT-TERM';
    case 'long-term': return 'LONG-TERM';
    default: return p.toUpperCase();
  }
}

function renderFindings(findings: Finding[]): string {
  const sorted = [...findings].sort((a, b) => {
    const order = ['CRITICAL', 'WARNING', 'INFO', 'OK'];
    return order.indexOf(a.risk) - order.indexOf(b.risk);
  });

  if (sorted.length === 0) {
    return '<p class="empty">No findings detected.</p>';
  }

  const rows = sorted.map((f) => `
    <tr>
      <td class="mono">${escapeHtml(f.file)}:${f.line}</td>
      <td class="mono">${escapeHtml(f.algorithm)}</td>
      <td><span class="badge" style="background:${riskColor(f.risk)}20;color:${riskColor(f.risk)}">${f.risk}</span></td>
      <td>${escapeHtml(f.explanation)}</td>
      <td class="mono accent">${escapeHtml(f.replacement)}</td>
    </tr>
  `).join('');

  return `
    <table>
      <thead>
        <tr>
          <th>Location</th>
          <th>Algorithm</th>
          <th>Risk</th>
          <th>Explanation</th>
          <th>Replacement</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderCompliance(report: FullComplianceReport): string {
  const rows = report.assessments.map((a) => `
    <tr>
      <td class="mono">${escapeHtml(a.framework.name)}</td>
      <td>${escapeHtml(a.framework.authority)}</td>
      <td><span class="badge" style="background:${statusColor(a.status)}20;color:${statusColor(a.status)}">${statusLabel(a.status)}</span></td>
      <td class="mono" style="color:${a.summary.nonCompliant > 0 ? '#ffb4ab' : '#39ff14'}">${a.summary.nonCompliant}</td>
      <td class="mono" style="color:${a.summary.deprecated > 0 ? '#fbbf24' : '#39ff14'}">${a.summary.deprecated}</td>
      <td class="mono">${a.framework.deadline ?? '—'}</td>
    </tr>
  `).join('');

  return `
    <table>
      <thead>
        <tr>
          <th>Framework</th>
          <th>Authority</th>
          <th>Status</th>
          <th>Non-Compliant</th>
          <th>Deprecated</th>
          <th>Deadline</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderMigrationSteps(steps: MigrationStep[]): string {
  if (steps.length === 0) return '<p class="empty">No migration steps required.</p>';

  const groups: Record<string, MigrationStep[]> = { immediate: [], 'short-term': [], 'long-term': [] };
  for (const s of steps) {
    (groups[s.priority] ?? []).push(s);
  }

  let html = '';
  for (const [priority, items] of Object.entries(groups)) {
    if (items.length === 0) continue;
    html += `<h3 class="priority-header">${priorityLabel(priority)} <span class="count">(${items.length})</span></h3>`;
    for (const s of items) {
      html += `
        <div class="step">
          <div class="step-header">
            <span class="mono">${escapeHtml(s.finding.algorithm)}</span>
            <span class="meta">${escapeHtml(s.finding.file)}:${s.finding.line}</span>
            <span class="badge effort">${s.effort.toUpperCase()}</span>
          </div>
          <p>${escapeHtml(s.action)}</p>
          ${s.dependencies.length > 0 ? `<p class="deps">Dependencies: ${s.dependencies.map(escapeHtml).join(', ')}</p>` : ''}
        </div>
      `;
    }
  }
  return html;
}

export function generateHtmlReport(input: ReportInput): string {
  const { scanReport, migrationPlan, complianceReport } = input;
  const now = new Date().toISOString();
  const projectName = scanReport.path.split('/').pop() || 'unknown';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Quantum Sentry Report — ${escapeHtml(projectName)}</title>
<style>
  :root { --bg: #131318; --surface: #1b1b20; --surface-low: #0e0e13; --text: #e4e1e9; --text-dim: #baccb0; --accent: #39ff14; --error: #ffb4ab; --warning: #fbbf24; --info: #60a5fa; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: var(--bg); color: var(--text); font-family: 'Space Grotesk', 'Segoe UI', system-ui, sans-serif; font-size: 14px; line-height: 1.6; padding: 3rem 2rem; max-width: 1100px; margin: 0 auto; }
  .mono { font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace; font-size: 12px; }
  h1 { font-size: 2.5rem; font-weight: 700; letter-spacing: -0.03em; color: var(--accent); margin-bottom: 0.5rem; }
  h1 span { color: #79ff5b; }
  h2 { font-size: 1rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text); margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 2px solid rgba(60,75,53,0.2); }
  h3.priority-header { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.2em; color: var(--text-dim); margin: 1.5rem 0 0.75rem; font-family: 'JetBrains Mono', monospace; }
  h3.priority-header .count { color: var(--accent); }
  .subtitle { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 2rem; }
  section { margin-bottom: 3rem; }
  .grade-box { display: inline-flex; align-items: center; justify-content: center; width: 80px; height: 80px; font-size: 3rem; font-weight: 700; font-family: 'JetBrains Mono', monospace; margin-right: 2rem; }
  .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-top: 1.5rem; }
  .stat { background: var(--surface); padding: 1rem; }
  .stat .label { font-family: 'JetBrains Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.15em; color: var(--text-dim); margin-bottom: 0.25rem; }
  .stat .value { font-family: 'JetBrains Mono', monospace; font-size: 1.5rem; font-weight: 700; }
  table { width: 100%; border-collapse: separate; border-spacing: 0 2px; }
  thead th { font-family: 'JetBrains Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; color: var(--text-dim); text-align: left; padding: 0.75rem 1rem; background: var(--surface-low); }
  tbody td { padding: 0.75rem 1rem; background: var(--surface); font-size: 13px; }
  tbody tr:nth-child(even) td { background: #1f1f24; }
  .badge { display: inline-block; padding: 2px 8px; font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 700; }
  .badge.effort { background: rgba(114,222,88,0.1); color: #72de58; }
  .accent { color: var(--accent); }
  .step { background: var(--surface); padding: 1rem; margin-bottom: 2px; }
  .step-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem; }
  .step-header .meta { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--text-dim); }
  .deps { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--accent); margin-top: 0.5rem; }
  .empty { color: var(--accent); font-family: 'JetBrains Mono', monospace; font-size: 13px; padding: 2rem; text-align: center; }
  .footer { margin-top: 3rem; padding-top: 1rem; border-top: 2px solid rgba(60,75,53,0.2); font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.15em; }
  .overall-status { display: inline-block; padding: 4px 12px; font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; margin-left: 1rem; }

  @media print {
    body { background: #fff; color: #000; padding: 1rem; font-size: 11px; }
    .mono { font-size: 10px; }
    h1 { color: #000; font-size: 1.5rem; }
    h1 span { color: #333; }
    h2 { border-bottom-color: #ccc; color: #000; }
    .subtitle { color: #666; }
    .stat { background: #f5f5f5; border: 1px solid #ddd; }
    .stat .label { color: #666; }
    .stat .value { color: #000; }
    thead th { background: #f0f0f0; color: #333; }
    tbody td { background: #fafafa; color: #000; }
    tbody tr:nth-child(even) td { background: #f5f5f5; }
    .step { background: #fafafa; border: 1px solid #eee; }
    .footer { color: #999; border-top-color: #ddd; }
    .grade-box { border: 2px solid #000; }
    .badge { border: 1px solid currentColor; }
    section { break-inside: avoid; }
    table { break-inside: auto; }
    tr { break-inside: avoid; }
  }
</style>
</head>
<body>

<header>
  <h1><span>QUANTUM SENTRY</span> REPORT</h1>
  <div class="subtitle">${escapeHtml(scanReport.path)} · Scanned ${scanReport.scannedAt.split('T')[0]}</div>
</header>

<section>
  <h2>Executive Summary</h2>
  <div style="display:flex;align-items:center;">
    <div class="grade-box" style="background:${gradeColor(scanReport.grade)}20;color:${gradeColor(scanReport.grade)};border:2px solid ${gradeColor(scanReport.grade)}">${scanReport.grade}</div>
    <div>
      <div style="font-size:1.25rem;font-weight:700;color:var(--text);">Grade ${scanReport.grade}</div>
      <div class="mono" style="color:var(--text-dim);margin-top:0.25rem">${scanReport.filesScanned} files scanned · ${scanReport.findings.length} findings</div>
      <span class="overall-status" style="background:${statusColor(complianceReport.overallStatus)}20;color:${statusColor(complianceReport.overallStatus)}">${statusLabel(complianceReport.overallStatus)}</span>
    </div>
  </div>
  <div class="summary-grid">
    <div class="stat"><div class="label">Critical</div><div class="value" style="color:var(--error)">${scanReport.summary.critical}</div></div>
    <div class="stat"><div class="label">Warning</div><div class="value" style="color:var(--warning)">${scanReport.summary.warning}</div></div>
    <div class="stat"><div class="label">Info</div><div class="value" style="color:var(--info)">${scanReport.summary.info}</div></div>
    <div class="stat"><div class="label">OK</div><div class="value" style="color:var(--accent)">${scanReport.summary.ok}</div></div>
  </div>
</section>

<section>
  <h2>Findings</h2>
  ${renderFindings(scanReport.findings)}
</section>

<section>
  <h2>Compliance Status</h2>
  ${renderCompliance(complianceReport)}
</section>

<section>
  <h2>Migration Plan</h2>
  <div class="mono" style="color:var(--text-dim);margin-bottom:1rem">${migrationPlan.estimatedEffort}</div>
  ${renderMigrationSteps(migrationPlan.steps)}
</section>

<footer class="footer">
  Generated by qcrypt-scan v0.2.0 · ${now} · Print this page (CMD+P / Ctrl+P) for PDF output
</footer>

</body>
</html>`;
}
