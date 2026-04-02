import type { Transmission } from '../types';

export type QuarterlyBreakdown = {
  quarter: 1 | 2 | 3 | 4;
  submissionCount: number;
  avgPerformance: number;
  avgProficiency: number;
  avgProfessionalism: number;
  avgFinalScore: number;
};

export type AnnualSummary = {
  year: number;
  yearAvgPerformance: number;
  yearAvgProficiency: number;
  yearAvgProfessionalism: number;
  yearAvgFinalScore: number;
  totalSubmissions: number;
  quarterly: QuarterlyBreakdown[];
};

export type YearTrendRow = {
  year: number;
  performance: number;
  trend: 'up' | 'down' | 'flat';
};

function transmissionYear(t: Transmission): number | null {
  const d = new Date(t.timestamp);
  if (Number.isNaN(d.getTime())) return null;
  return d.getFullYear();
}

function quarterOf(d: Date): 1 | 2 | 3 | 4 {
  return (Math.floor(d.getMonth() / 3) + 1) as 1 | 2 | 3 | 4;
}

function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function isValidated(t: Transmission): boolean {
  return t.status === 'validated';
}

export function getAvailableYears(transmissions: Transmission[]): number[] {
  const years = new Set<number>();
  for (const t of transmissions) {
    if (!isValidated(t)) continue;
    const y = transmissionYear(t);
    if (y != null) years.add(y);
  }
  return [...years].sort((a, b) => b - a);
}

export function calculateAnnualSummary(transmissions: Transmission[], year: number): AnnualSummary {
  const inYear = transmissions.filter((t) => isValidated(t) && transmissionYear(t) === year);

  const performances = inYear.map((t) => Number(t.ratings?.performance ?? 0));
  const proficiencies = inYear.map((t) => Number(t.ratings?.proficiency ?? 0));
  const professionals = inYear.map((t) => Number(t.ratings?.professionalism ?? 0));
  const finals = inYear.map((t) => Number(t.ratings?.finalScore ?? 0));

  const byQuarter: Record<1 | 2 | 3 | 4, Transmission[]> = { 1: [], 2: [], 3: [], 4: [] };
  for (const t of inYear) {
    const d = new Date(t.timestamp);
    if (Number.isNaN(d.getTime())) continue;
    byQuarter[quarterOf(d)].push(t);
  }

  const quarterly: QuarterlyBreakdown[] = ([1, 2, 3, 4] as const)
    .map((q) => {
      const arr = byQuarter[q];
      return {
        quarter: q,
        submissionCount: arr.length,
        avgPerformance: mean(arr.map((x) => Number(x.ratings?.performance ?? 0))),
        avgProficiency: mean(arr.map((x) => Number(x.ratings?.proficiency ?? 0))),
        avgProfessionalism: mean(arr.map((x) => Number(x.ratings?.professionalism ?? 0))),
        avgFinalScore: mean(arr.map((x) => Number(x.ratings?.finalScore ?? 0))),
      };
    })
    .filter((q) => q.submissionCount > 0);

  return {
    year,
    yearAvgPerformance: mean(performances),
    yearAvgProficiency: mean(proficiencies),
    yearAvgProfessionalism: mean(professionals),
    yearAvgFinalScore: mean(finals),
    totalSubmissions: inYear.length,
    quarterly,
  };
}

export function compareAnnualPerformance(summaries: AnnualSummary[]): YearTrendRow[] {
  const sorted = [...summaries].sort((a, b) => a.year - b.year);
  return sorted.map((s, i) => {
    const prevPerf = i > 0 ? sorted[i - 1].yearAvgPerformance : null;
    const perf = s.yearAvgPerformance;
    let trend: 'up' | 'down' | 'flat' = 'flat';
    if (prevPerf != null) {
      const delta = perf - prevPerf;
      if (delta > 0.5) trend = 'up';
      else if (delta < -0.5) trend = 'down';
    }
    return { year: s.year, performance: perf, trend };
  });
}
