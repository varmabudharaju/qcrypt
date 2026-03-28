import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/comparison', label: 'Comparison' },
  { to: '/education', label: 'Education' },
];

export default function Sidebar() {
  return (
    <aside className="w-56 border-r border-slate-200 dark:border-[#1a1a1a] p-4 flex flex-col gap-1">
      <div className="text-lg font-bold text-accent mb-4">qcrypt-bench</div>
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `block px-3 py-2 rounded text-sm transition-colors ${
              isActive
                ? 'bg-accent/10 text-accent font-medium'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1a1a1a]'
            }`
          }
        >
          {link.label}
        </NavLink>
      ))}
    </aside>
  );
}
