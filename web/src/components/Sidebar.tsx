import { NavLink, useNavigate } from 'react-router-dom';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
}

const navItems: NavItem[] = [
  { to: '/', label: 'DASHBOARD', icon: 'dashboard', end: true },
  { to: '/projects', label: 'PROJECTS', icon: 'folder_open' },
  { to: '/migration', label: 'MIGRATION', icon: 'conversion_path' },
  { to: '/compliance', label: 'COMPLIANCE', icon: 'verified_user' },
  { to: '/benchmarks', label: 'BENCHMARKS', icon: 'speed' },
];

export function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className="w-56 h-screen fixed left-0 top-0 flex flex-col bg-surface-container-low z-20">
      {/* Branding */}
      <div className="px-4 pt-5 pb-4">
        <h1 className="font-mono text-lg font-bold text-primary-container text-glow tracking-tight">
          QC-SENTRY
        </h1>
        <p className="font-mono text-[10px] text-on-surface-variant tracking-[0.2em] uppercase mt-0.5">
          LEVEL 4 CLEARANCE
        </p>
      </div>

      {/* Divider line (tonal shift, not a border) */}
      <div className="h-px bg-surface-container-high mx-4" />

      {/* Navigation */}
      <nav className="flex-1 px-3 pt-4 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 font-mono text-xs font-medium tracking-wider transition-all ${
                isActive
                  ? 'bg-primary-container text-on-primary shadow-neon-sm'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'
              }`
            }
          >
            <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Scan button */}
      <div className="p-3">
        <button
          onClick={() => navigate('/')}
          className="btn-neon w-full py-2.5 px-4 text-xs flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[16px]">radar</span>
          NEW SCAN
        </button>
      </div>

      {/* Footer version */}
      <div className="px-4 pb-3">
        <p className="font-mono text-[9px] text-on-surface-variant/50 tracking-wider">
          QCS v0.2.0 // NIST PQC
        </p>
      </div>
    </aside>
  );
}
