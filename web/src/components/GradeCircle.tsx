interface GradeCircleProps {
  grade: string;
  size?: number;
}

const gradeToScore: Record<string, number> = { A: 95, B: 78, C: 60, D: 35, F: 15 };
const gradeToColor: Record<string, string> = {
  A: '#39ff14', B: '#72de58', C: '#e7bdb8', D: '#ffb4ab', F: '#ff4444',
};

export function GradeCircle({ grade, size = 120 }: GradeCircleProps) {
  const score = gradeToScore[grade] ?? 50;
  const color = gradeToColor[grade] ?? '#85967c';
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background ring */}
        <circle cx={size/2} cy={size/2} r={radius} fill="none"
          stroke="#2a292f" strokeWidth="6" />
        {/* Score ring */}
        <circle cx={size/2} cy={size/2} r={radius} fill="none"
          stroke={color} strokeWidth="6" strokeLinecap="butt"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-1000"
          style={{ filter: `drop-shadow(0 0 6px ${color}80)` }} />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-mono text-3xl font-bold" style={{ color, textShadow: `0 0 10px ${color}60` }}>
          {score}
        </span>
        <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
          Grade {grade}
        </span>
      </div>
    </div>
  );
}
