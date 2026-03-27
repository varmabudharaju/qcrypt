interface GradeCircleProps {
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  size?: number;
}

const gradeToScore: Record<string, number> = { A: 95, B: 78, C: 60, D: 35, F: 15 };
const gradeToColor: Record<string, string> = {
  A: '#22c55e', B: '#22c55e', C: '#f59e0b', D: '#ef4444', F: '#ef4444',
};

export function GradeCircle({ grade, size = 120 }: GradeCircleProps) {
  const score = gradeToScore[grade] ?? 50;
  const color = gradeToColor[grade] ?? '#666';
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background ring */}
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="currentColor"
          className="text-slate-200 dark:text-[#1a1a1a]" strokeWidth="8" />
        {/* Score ring */}
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color}
          strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-1000" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold" style={{ color }}>{score}</span>
        <span className="text-xs text-slate-500 dark:text-[#666666] uppercase">Grade {grade}</span>
      </div>
    </div>
  );
}
