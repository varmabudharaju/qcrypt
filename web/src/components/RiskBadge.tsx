type Risk = 'CRITICAL' | 'WARNING' | 'INFO' | 'OK';

const riskStyles: Record<Risk, string> = {
  CRITICAL: 'bg-error-container/40 text-error',
  WARNING: 'bg-tertiary-fixed-dim/20 text-tertiary-fixed-dim',
  INFO: 'bg-surface-container-high text-on-surface-variant',
  OK: 'bg-primary-container/15 text-primary-container',
};

export function RiskBadge({ risk }: { risk: Risk }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider uppercase ${riskStyles[risk]}`}>
      {risk}
    </span>
  );
}
