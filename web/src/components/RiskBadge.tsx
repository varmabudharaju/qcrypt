type Risk = 'CRITICAL' | 'WARNING' | 'INFO' | 'OK';

const riskStyles: Record<Risk, string> = {
  CRITICAL: 'bg-red-500/10 text-red-500 border-red-500/20',
  WARNING: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  INFO: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  OK: 'bg-green-500/10 text-green-500 border-green-500/20',
};

export function RiskBadge({ risk }: { risk: Risk }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${riskStyles[risk]}`}>
      {risk}
    </span>
  );
}
