import { useState, useEffect } from 'react';
import { healthCheck } from '../api';

export function TopNav() {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    healthCheck().then(() => setOnline(true)).catch(() => setOnline(false));
    const interval = setInterval(() => {
      healthCheck().then(() => setOnline(true)).catch(() => setOnline(false));
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-12 glass-panel flex items-center justify-between px-6 border-b border-surface-container-high/30">
      {/* Left: system designation */}
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-on-surface-variant tracking-widest uppercase">
          SYS::QUANTUM_AUDIT_v2
        </span>
      </div>

      {/* Right: status + actions */}
      <div className="flex items-center gap-4">
        {/* System status */}
        <div className="flex items-center gap-2">
          <div className={`pulse-dot rounded-full ${online ? '' : 'bg-error !shadow-none'}`}
               style={online ? undefined : { backgroundColor: '#ffb4ab', boxShadow: 'none', animation: 'none' }} />
          <span className="font-mono text-xs text-on-surface-variant">
            {online ? 'ENGINES ONLINE' : 'OFFLINE'}
          </span>
        </div>

        {/* Notification bell */}
        <button className="p-1.5 text-on-surface-variant hover:text-primary-container transition-colors"
                title="Notifications">
          <span className="material-symbols-outlined text-[20px]">notifications</span>
        </button>

        {/* Settings */}
        <button className="p-1.5 text-on-surface-variant hover:text-primary-container transition-colors"
                title="Settings">
          <span className="material-symbols-outlined text-[20px]">settings</span>
        </button>
      </div>
    </header>
  );
}
