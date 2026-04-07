interface StatsCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  accentColor?: 'neon' | 'error' | 'warning' | 'default';
}

const accentMap: Record<string, string> = {
  neon: 'text-primary-container text-glow-sm',
  error: 'text-error',
  warning: 'text-tertiary-fixed-dim',
  default: 'text-primary',
};

export function StatsCard({ label, value, subtitle, accentColor = 'default' }: StatsCardProps) {
  return (
    <div className="bg-surface-container-low p-5">
      <p className="font-mono text-[10px] uppercase text-on-surface-variant tracking-wider mb-2">{label}</p>
      <p className={`stat-value text-3xl ${accentMap[accentColor]}`}>{value}</p>
      {subtitle && <p className="font-mono text-xs text-on-surface-variant mt-1">{subtitle}</p>}
    </div>
  );
}
