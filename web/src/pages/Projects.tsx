import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProjects, getOverview } from '../api';
import type { ProjectWithLatestScan, OverviewStats } from '../api';
import { StatsCard } from '../components/StatsCard';
const GRADE_COLORS: Record<string, string> = {
  A: 'bg-primary-container text-on-primary',
  B: 'bg-secondary text-on-primary',
  C: 'bg-tertiary-fixed-dim text-on-tertiary-fixed',
  D: 'bg-error/80 text-on-error',
  F: 'bg-error text-on-error',
};

export function Projects() {
  const [projects, setProjects] = useState<ProjectWithLatestScan[]>([]);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      getProjects().then(setProjects),
      getOverview().then(setOverview),
    ])
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load projects'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-8 h-8 border-2 border-primary-container border-t-transparent animate-spin" />
        <p className="font-mono text-xs text-on-surface-variant tracking-wider">LOADING PROJECTS...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {error && <p className="font-mono text-xs text-error bg-error/10 p-3">{error}</p>}
      {/* Header */}
      <div>
        <p className="font-mono text-[10px] text-on-surface-variant tracking-[0.3em] uppercase mb-2">
          PROJECT REGISTRY
        </p>
        <h1 className="font-display text-3xl font-bold text-primary uppercase tracking-tight">
          MONITORED PROJECTS
        </h1>
      </div>

      {/* Overview Stats */}
      {overview && (
        <div className="grid grid-cols-4 gap-px bg-surface-container-high">
          <StatsCard label="Total Projects" value={overview.totalProjects} accentColor="neon" />
          <StatsCard label="Total Scans" value={overview.totalScans} accentColor="default" />
          <StatsCard label="Critical Findings" value={overview.totalCritical} accentColor={overview.totalCritical > 0 ? 'error' : 'neon'} />
          <StatsCard label="Worst Grade" value={overview.worstGrade || 'N/A'} accentColor={overview.worstGrade === 'F' || overview.worstGrade === 'D' ? 'error' : 'warning'} />
        </div>
      )}

      {/* Project Cards Grid */}
      {projects.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-low">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/20">folder_off</span>
          <p className="font-mono text-sm text-on-surface-variant mt-4">NO PROJECTS FOUND</p>
          <p className="font-mono text-xs text-on-surface-variant/50 mt-1">Run a scan from the dashboard to create your first project</p>
          <Link to="/" className="btn-neon inline-block px-6 py-2.5 text-xs mt-6">
            INITIATE SCAN
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-surface-container-high">
          {projects.map((proj) => (
            <Link
              key={proj.id}
              to={`/projects/${proj.id}`}
              className="bg-surface-container-low p-5 hover:bg-surface-container transition-colors group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-bold text-primary truncate group-hover:text-primary-container transition-colors">
                    {proj.name}
                  </p>
                  <p className="font-mono text-[10px] text-on-surface-variant/50 mt-1 truncate">
                    {proj.path}
                  </p>
                </div>
                {proj.latestScan && (
                  <span className={`font-mono text-lg font-black px-3 py-1.5 ${GRADE_COLORS[proj.latestScan.grade] ?? 'bg-surface-container-high text-on-surface-variant'}`}>
                    {proj.latestScan.grade}
                  </span>
                )}
              </div>

              {proj.latestScan ? (
                <div className="space-y-2">
                  <div className="flex gap-3 font-mono text-[10px]">
                    <span className={proj.latestScan.summary.critical > 0 ? 'text-error' : 'text-on-surface-variant/50'}>
                      {proj.latestScan.summary.critical} CRITICAL
                    </span>
                    <span className={proj.latestScan.summary.warning > 0 ? 'text-tertiary-fixed-dim' : 'text-on-surface-variant/50'}>
                      {proj.latestScan.summary.warning} WARNING
                    </span>
                  </div>
                  <p className="font-mono text-[10px] text-on-surface-variant/40">
                    Last scan: {new Date(proj.latestScan.scannedAt).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <p className="font-mono text-[10px] text-on-surface-variant/40">No scans yet</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
