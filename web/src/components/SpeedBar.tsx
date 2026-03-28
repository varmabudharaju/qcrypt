interface Props {
  label: string;
  value: number;
  maxValue: number;
  color: string;
}

export default function SpeedBar({ label, value, maxValue, color }: Props) {
  const width = Math.min((value / maxValue) * 100, 100);

  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span>{label}</span>
        <span className="font-mono">{value.toLocaleString()} ops/s</span>
      </div>
      <div className="h-4 bg-slate-100 dark:bg-[#1a1a1a] rounded overflow-hidden">
        <div
          className="h-full rounded transition-all duration-500"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
