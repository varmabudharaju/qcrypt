export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

export const GRADE_ORDER: Grade[] = ['A', 'B', 'C', 'D', 'F'];

export function shouldFail(grade: Grade, threshold: Grade): boolean {
  return GRADE_ORDER.indexOf(grade) >= GRADE_ORDER.indexOf(threshold);
}
