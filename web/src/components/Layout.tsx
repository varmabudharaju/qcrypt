import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.tsx';
import ThemeToggle from './ThemeToggle.tsx';

export default function Layout() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-[#1a1a1a]">
          <h1 className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Post-Quantum Cryptography Benchmark
          </h1>
          <ThemeToggle />
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
