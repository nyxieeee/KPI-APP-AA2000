export type PerformanceLevel = 
  | 'Outstanding' 
  | 'Exceeds Expectations' 
  | 'Excellent' 
  | 'Very Good' 
  | 'Good' 
  | 'Solid' 
  | 'Above Average' 
  | 'Meets Expectations' 
  | 'Needs Improvement' 
  | 'Unsatisfactory';

export interface GradeInfo {
  letter: string;
  label: PerformanceLevel;
  color: string; // Tailwind-friendly or Hex
  minScore: number;
}

export const GRADING_SCALE: GradeInfo[] = [
  { letter: 'A+', label: 'Outstanding', color: 'emerald', minScore: 97 },
  { letter: 'A', label: 'Exceeds Expectations', color: 'emerald', minScore: 93 },
  { letter: 'A-', label: 'Excellent', color: 'blue', minScore: 90 },
  { letter: 'B+', label: 'Very Good', color: 'blue', minScore: 87 },
  { letter: 'B', label: 'Good', color: 'cyan', minScore: 83 },
  { letter: 'B-', label: 'Solid', color: 'cyan', minScore: 80 },
  { letter: 'C+', label: 'Above Average', color: 'indigo', minScore: 75 },
  { letter: 'C', label: 'Meets Expectations', color: 'indigo', minScore: 70 },
  { letter: 'D', label: 'Needs Improvement', color: 'amber', minScore: 60 },
  { letter: 'F', label: 'Unsatisfactory', color: 'rose', minScore: 0 },
];

export function getGradeForScore(score: number): GradeInfo {
  const s = Math.max(0, Math.min(100, score));
  return GRADING_SCALE.find(g => s >= g.minScore) || GRADING_SCALE[GRADING_SCALE.length - 1];
}

/** Returns Tailwind color classes based on the grade info. */
export function getGradeColorClasses(color: string): { bg: string; text: string; border: string } {
  switch (color) {
    case 'emerald': return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' };
    case 'blue': return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' };
    case 'cyan': return { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-100' };
    case 'indigo': return { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100' };
    case 'amber': return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' };
    case 'rose': return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100' };
    default: return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-100' };
  }
}
