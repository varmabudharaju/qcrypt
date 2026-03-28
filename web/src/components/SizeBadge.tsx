interface Props {
  label: string;
  bytes: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  return `${(bytes / 1024).toFixed(1)}KB`;
}

export default function SizeBadge({ label, bytes }: Props) {
  return (
    <div className="inline-flex flex-col items-center px-3 py-2 rounded border border-slate-200 dark:border-[#333]">
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-sm font-mono font-bold">{formatBytes(bytes)}</span>
    </div>
  );
}
