interface StatsCardProps {
  label: string;
  value: string | number;
  trend?: string;
  color?: 'default' | 'red' | 'green';
}

const colorMap = {
  default: 'text-slate-800 dark:text-[#e0e0e0]',
  red: 'text-red-500',
  green: 'text-green-500 dark:text-[#00FF41]',
};

export function StatsCard({ label, value, trend, color = 'default' }: StatsCardProps) {
  return (
    <div className="bg-white dark:bg-[#111111] rounded-xl border border-slate-200 dark:border-[#1a1a1a] p-5">
      <p className="text-sm text-slate-500 dark:text-[#666666] mb-1">{label}</p>
      <p className={`text-3xl font-bold ${colorMap[color]}`}>{value}</p>
      {trend && <p className="text-xs text-slate-400 dark:text-[#666666] mt-1">{trend}</p>}
    </div>
  );
}
