import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import type { ScanReport, MigrationPlan } from '../types.js';

export interface ScanRow {
  id: string;
  project_id: string;
  scanned_at: string;
  grade: string;
  files_scanned: number;
  critical: number;
  warning: number;
  info: number;
  ok: number;
  report_json: string;
  plan_json: string;
  created_at: string;
}

export function createScan(
  db: Database.Database,
  projectId: string,
  report: ScanReport,
  plan: MigrationPlan,
): ScanRow {
  const id = randomUUID();
  const created_at = new Date().toISOString();
  const row: ScanRow = {
    id,
    project_id: projectId,
    scanned_at: report.scannedAt,
    grade: report.grade,
    files_scanned: report.filesScanned,
    critical: report.summary.critical,
    warning: report.summary.warning,
    info: report.summary.info,
    ok: report.summary.ok,
    report_json: JSON.stringify(report),
    plan_json: JSON.stringify(plan),
    created_at,
  };

  db.prepare(`
    INSERT INTO scans (id, project_id, scanned_at, grade, files_scanned, critical, warning, info, ok, report_json, plan_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, projectId, row.scanned_at, row.grade, row.files_scanned, row.critical, row.warning, row.info, row.ok, row.report_json, row.plan_json, created_at);

  return row;
}

export function getScanWithDetails(db: Database.Database, scanId: string): ScanRow | undefined {
  return db.prepare('SELECT * FROM scans WHERE id = ?').get(scanId) as ScanRow | undefined;
}

const GRADE_ORDER = ['F', 'D', 'C', 'B', 'A'];

export interface OverviewStats {
  totalProjects: number;
  totalScans: number;
  totalCritical: number;
  worstGrade: string | null;
}

export function getOverviewStats(db: Database.Database): OverviewStats {
  const counts = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM projects) AS totalProjects,
      (SELECT COUNT(*) FROM scans) AS totalScans,
      (SELECT COALESCE(SUM(critical), 0) FROM scans s
        WHERE s.id = (SELECT id FROM scans WHERE project_id = s.project_id ORDER BY scanned_at DESC LIMIT 1)
      ) AS totalCritical
  `).get() as { totalProjects: number; totalScans: number; totalCritical: number };

  const grades = db.prepare(`
    SELECT DISTINCT s.grade FROM scans s
    WHERE s.id = (SELECT id FROM scans WHERE project_id = s.project_id ORDER BY scanned_at DESC LIMIT 1)
  `).all() as Array<{ grade: string }>;

  let worstGrade: string | null = null;
  if (grades.length > 0) {
    worstGrade = grades.reduce((worst, row) => {
      const worstIdx = GRADE_ORDER.indexOf(worst);
      const rowIdx = GRADE_ORDER.indexOf(row.grade);
      return rowIdx < worstIdx ? row.grade : worst;
    }, grades[0].grade);
  }

  return { ...counts, worstGrade };
}
