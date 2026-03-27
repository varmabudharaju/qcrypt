import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '⊞' },
  { to: '/scans', label: 'Scans', icon: '◎' },
  { to: '/leaderboard', label: 'Leaderboard', icon: '⊟' },
  { to: '/docs', label: 'Docs', icon: '⊡' },
];

export function Sidebar() {
  return (
    <aside className="w-56 h-screen fixed left-0 top-0 flex flex-col border-r border-slate-200 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] z-10">
      {/* Logo */}
      <div className="p-5 border-b border-slate-200 dark:border-[#1a1a1a]">
        <h1 className="text-lg font-bold text-slate-800 dark:text-[#00FF41] tracking-tight">
          qcrypt-scan
        </h1>
        <p className="text-xs text-slate-400 dark:text-[#666666] mt-0.5 uppercase tracking-widest">
          Quantum Sentry
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600 dark:bg-[#00FF41]/10 dark:text-[#00FF41]'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-[#999999] dark:hover:bg-[#1a1a1a]'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* New Scan Button */}
      <div className="p-4">
        <NavLink
          to="/"
          className="block w-full py-2.5 px-4 text-center text-sm font-semibold rounded-lg bg-blue-500 text-white hover:bg-blue-600 dark:bg-[#00FF41] dark:text-black dark:hover:bg-[#00dd38] transition-colors"
        >
          + New Scan
        </NavLink>
      </div>
    </aside>
  );
}
