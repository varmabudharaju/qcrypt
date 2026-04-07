import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProject, deleteProject, rescanProject } from '../api';
import type { ProjectDetail as ProjectDetailType } from '../api';
const GRADE_COLORS: Record<string, string> = {
  A: 'bg-primary-container text-on-primary',
  B: 'bg-secondary text-on-primary',
  C: 'bg-tertiary-fixed-dim text-on-tertiary-fixed',
  D: 'bg-error/80 text-on-error',
  F: 'bg-error text-on-error',
};

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ProjectDetailType | null>(null);
  const [error, setError] = useState('');
  const [rescanning, setRescanning] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    getProject(id).then(setData).catch((err) => setError(err.message));
  }, [id]);

  const handleRescan = async () => {
    if (!id) return;
    setRescanning(true);
    try {
      const res = await rescanProject(id);
      navigate(`/scans/${res.scan.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rescan failed');
    } finally {
      setRescanning(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteProject(id);
      navigate('/projects');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      setDeleting(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <span className="material-symbols-outlined text-5xl text-error">error</span>
        <p className="font-mono text-error text-sm">{error}</p>
        <Link to="/projects" className="font-mono text-xs text-primary-container hover:text-primary-fixed">
          &lt; RETURN TO PROJECTS
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-8 h-8 border-2 border-primary-container border-t-transparent animate-spin" />
        <p className="font-mono text-xs text-on-surface-variant tracking-wider">LOADING PROJECT...</p>
      </div>
    );
  }

  const { project, scans } = data;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Back */}
      <Link to="/projects" className="font-mono text-xs text-primary-container hover:text-primary-fixed inline-flex items-center gap-1 transition-colors">
        <span className="material-symbols-outlined text-[14px]">arrow_back</span>
        PROJECTS
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary uppercase">{project.name}</h1>
          <p className="font-mono text-xs text-on-surface-variant mt-1">{project.path}</p>
          <p className="font-mono text-[10px] text-on-surface-variant/50 mt-0.5">
            Created: {new Date(project.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRescan}
            disabled={rescanning}
            className="btn-neon px-5 py-2 text-xs"
          >
            {rescanning ? 'SCANNING...' : 'RESCAN'}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-5 py-2 font-mono text-xs font-bold text-error bg-error-container/20 hover:bg-error-container/40 transition-colors"
          >
            {deleting ? 'DELETING...' : 'DELETE'}
          </button>
        </div>
      </div>

      {/* Scan History */}
      <div>
        <h2 className="font-mono text-xs text-on-surface-variant tracking-[0.2em] uppercase mb-3">
          SCAN HISTORY ({scans.length})
        </h2>
        {scans.length === 0 ? (
          <div className="bg-surface-container-low p-8 text-center">
            <p className="font-mono text-xs text-on-surface-variant">No scans recorded for this project</p>
          </div>
        ) : (
          <div className="space-y-1">
            {scans.map((scan) => (
              <Link
                key={scan.id}
                to={`/scans/${scan.id}`}
                className="flex items-center justify-between bg-surface-container-low p-4 hover:bg-surface-container transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <span className={`font-mono text-sm font-bold px-2 py-1 ${GRADE_COLORS[scan.grade] ?? 'bg-surface-container-high text-on-surface-variant'}`}>
                    {scan.grade}
                  </span>
                  <div>
                    <p className="font-mono text-xs text-primary group-hover:text-primary-container transition-colors">
                      {new Date(scan.scanned_at).toLocaleString()}
                    </p>
                    <p className="font-mono text-[10px] text-on-surface-variant/50">
                      {scan.files_scanned} files
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 font-mono text-[10px]">
                  {scan.critical > 0 && <span className="text-error">{scan.critical} CRIT</span>}
                  {scan.warning > 0 && <span className="text-tertiary-fixed-dim">{scan.warning} WARN</span>}
                  <span className="material-symbols-outlined text-[14px] text-on-surface-variant/40 group-hover:text-primary-container transition-colors">
                    chevron_right
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
