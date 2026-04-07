import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';

export function Layout() {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <Sidebar />

      {/* Main content area */}
      <div className="ml-56 min-h-screen flex flex-col">
        <TopNav />

        {/* Page content with scanline overlay */}
        <main className="flex-1 p-6 relative">
          <Outlet />
          {/* Scanline overlay */}
          <div className="scanline-overlay" />
          <div className="crt-vignette" />
        </main>
      </div>
    </div>
  );
}
