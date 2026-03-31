import type { Transmission } from '../types';

export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export type PerformanceCategory = {
  /** Display label (also used to match snapshot names). */
  name: string;
  /** Short label for bar chart (e.g. ACC, PUR). */
  label: string;
  weightPct: number;
};

export type QuarterlyPerformanceStats = {
  quarter: Quarter;
  count: number;
  ratings?: { finalScore: number };
  categoryStats: Array<PerformanceCategory & { val: number }>;
};

export function getCurrentQuarter(now = new Date()): Quarter {
  const m = now.getMonth();
  if (m <= 2) return 'Q1';
  if (m <= 5) return 'Q2';
  if (m <= 8) return 'Q3';
  return 'Q4';
}

export function isInQuarter(date: Date, q: Quarter, year: number) {
  const m = date.getMonth();
  const startMonth = q === 'Q1' ? 0 : q === 'Q2' ? 3 : q === 'Q3' ? 6 : 9;
  const endMonth = startMonth + 2;
  return date.getFullYear() === year && m >= startMonth && m <= endMonth;
}

export function computeQuarterlyStats(params: {
  transmissions: Transmission[];
  userId: string;
  department?: string;
  quarter: Quarter;
  year: number;
  categories: PerformanceCategory[];
  /**
   * Used only when a transmission has no logDetailSnapshot match.
   * Return undefined when no validated category score exists.
   */
  getCategoryScoreFallback?: (t: Transmission, categoryName: string) => number | undefined;
  /**
   * Used only when transmission.ratings.finalScore is missing.
   * If omitted, we compute final as weighted sum of category scores.
   */
  getFinalScoreFallback?: (t: Transmission, categoryScores: Record<string, number>) => number;
}): QuarterlyPerformanceStats {
  const { transmissions, userId, department, quarter, year, categories } = params;

  const history = (transmissions || [])
    .filter((t) => t.userId === userId)
    // Many older/seed records may not have `department` set; don't drop them.
    .filter((t) => (department ? (t.department ? t.department === department : true) : true))
    .filter((t) => t.status === 'validated')
    .filter((t) => isInQuarter(new Date(t.timestamp), quarter, year));

  if (history.length === 0) {
    return {
      quarter,
      count: 0,
      categoryStats: categories.map((c) => ({ ...c, val: 0 })),
    };
  }

  const safeNum = (v: any) => {
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const getCategoryScore = (t: Transmission, categoryName: string): number | undefined => {
    const snap = t.ratings?.logDetailSnapshot?.find((s) => s?.name === categoryName);
    if (snap && typeof snap.score === 'number') return Math.min(100, Math.max(0, snap.score));
    const fb = params.getCategoryScoreFallback?.(t, categoryName);
    if (fb == null) return undefined;
    return Math.min(100, Math.max(0, safeNum(fb)));
  };

  const categoryTotals: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  categories.forEach((c) => {
    categoryTotals[c.name] = 0;
    categoryCounts[c.name] = 0;
  });

  let finalTotal = 0;

  history.forEach((t) => {
    const categoryScores: Record<string, number> = {};
    categories.forEach((c) => {
      const s = getCategoryScore(t, c.name);
      if (s != null) {
        categoryTotals[c.name] += s;
        categoryCounts[c.name] += 1;
        categoryScores[c.name] = s;
      }
    });

    const final =
      t.ratings?.finalScore != null
        ? safeNum(t.ratings.finalScore)
        : params.getFinalScoreFallback
          ? safeNum(params.getFinalScoreFallback(t, categoryScores))
          : categories.reduce((sum, c) => sum + categoryScores[c.name] * (c.weightPct / 100), 0);

    finalTotal += Math.min(100, Math.max(0, final));
  });

  const avgFinal = Math.round((finalTotal / history.length) * 100) / 100;
  const categoryStats = categories.map((c) => ({
    ...c,
    val: categoryCounts[c.name] > 0
      ? Math.min(100, Math.round(categoryTotals[c.name] / categoryCounts[c.name]))
      : 0,
  }));

  return {
    quarter,
    count: history.length,
    ratings: { finalScore: avgFinal },
    categoryStats,
  };
}

