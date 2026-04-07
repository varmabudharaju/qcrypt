import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';

export interface ProjectRow {
  id: string;
  name: string;
  path: string;
  created_at: string;
}

export interface ProjectWithLatestScan extends ProjectRow {
  latest_scan_id: string | null;
  latest_grade: string | null;
  latest_scanned_at: string | null;
  latest_critical: number | null;
  latest_warning: number | null;
  latest_info: number | null;
  latest_ok: number | null;
  latest_files_scanned: number | null;
  scan_count: number;
}

export function createProject(db: Database.Database, projectPath: string, name: string): ProjectRow {
  const id = randomUUID();
  const created_at = new Date().toISOString();
  db.prepare(
    'INSERT INTO projects (id, name, path, created_at) VALUES (?, ?, ?, ?)',
  ).run(id, name, projectPath, created_at);
  return { id, name, path: projectPath, created_at };
}

export function findProjectByPath(db: Database.Database, projectPath: string): ProjectRow | undefined {
  return db.prepare('SELECT * FROM projects WHERE path = ?').get(projectPath) as ProjectRow | undefined;
}

export function listProjectsWithLatestScan(db: Database.Database): ProjectWithLatestScan[] {
  return db.prepare(`
    SELECT
      p.*,
      s.id           AS latest_scan_id,
      s.grade        AS latest_grade,
      s.scanned_at   AS latest_scanned_at,
      s.critical      AS latest_critical,
      s.warning       AS latest_warning,
      s.info          AS latest_info,
      s.ok            AS latest_ok,
      s.files_scanned AS latest_files_scanned,
      (SELECT COUNT(*) FROM scans WHERE project_id = p.id) AS scan_count
    FROM projects p
    LEFT JOIN scans s ON s.id = (
      SELECT id FROM scans WHERE project_id = p.id ORDER BY scanned_at DESC LIMIT 1
    )
    ORDER BY s.scanned_at DESC NULLS LAST, p.created_at DESC
  `).all() as ProjectWithLatestScan[];
}

export function getProjectWithScans(
  db: Database.Database,
  projectId: string,
): { project: ProjectRow; scans: Array<Record<string, unknown>> } | undefined {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId) as ProjectRow | undefined;
  if (!project) return undefined;

  const scans = db.prepare(
    'SELECT id, scanned_at, grade, files_scanned, critical, warning, info, ok FROM scans WHERE project_id = ? ORDER BY scanned_at DESC',
  ).all(projectId) as Array<Record<string, unknown>>;

  return { project, scans };
}

export function deleteProject(db: Database.Database, projectId: string): boolean {
  const result = db.prepare('DELETE FROM projects WHERE id = ?').run(projectId);
  return result.changes > 0;
}
