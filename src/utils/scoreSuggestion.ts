/**
 * Returns a short, encouraging suggestion based on quarterly score and category breakdown.
 * Gender-neutral. No AI/API — rule-based from category scores.
 */
export interface CategoryStatForSuggestion {
  label: string;
  val: number;
}

export interface ScoreSuggestion {
  headline: string;
  message: string;
  variant: 'excellent' | 'good' | 'solid' | 'progress' | 'growth' | 'empty';
}

export function getScoreSuggestion(
  finalScore: number | undefined | null,
  categoryStats: CategoryStatForSuggestion[] | undefined | null,
  count: number
): ScoreSuggestion {
  const stats = Array.isArray(categoryStats) ? categoryStats : [];

  if (count === 0 || finalScore == null || !Number.isFinite(finalScore)) {
    return {
      headline: 'No data yet',
      message: "Once your audits are validated for this quarter, you'll see personalized suggestions here. Keep submitting — you're on track.",
      variant: 'empty'
    };
  }

  const score = Number(finalScore);
  const sorted = [...stats].sort((a, b) => (a?.val ?? 0) - (b?.val ?? 0));
  const lowCategories = sorted.filter(c => (c?.val ?? 0) < 85).slice(0, 2);
  const lowNames = lowCategories.map(c => c?.label ?? '').filter(Boolean).join(' and ');

  if (score >= 95) {
    return {
      headline: 'Outstanding quarter',
      message: "Your consistency across categories is impressive. Keep setting the bar high — you're a strong performer.",
      variant: 'excellent'
    };
  }

  if (score >= 90) {
    if (lowCategories.length === 0) {
      return {
        headline: 'Great work',
        message: "You're meeting targets across the board. Keep it up and consider helping others share the same focus.",
        variant: 'excellent'
      };
    }
    return {
      headline: 'Great work this quarter',
      message: `You're on target overall. To aim even higher, a little extra focus on ${lowNames} can make a real difference next quarter.`,
      variant: 'good'
    };
  }

  if (score >= 80) {
    if (lowCategories.length === 0) {
      return {
        headline: 'Solid performance',
        message: "You're in a good range. Look for small wins in one or two categories to push into the next tier.",
        variant: 'solid'
      };
    }
    return {
      headline: 'Solid performance',
      message: `Focus on strengthening ${lowNames} next quarter. You're close — a bit more attention there will boost your overall score.`,
      variant: 'solid'
    };
  }

  if (score >= 70) {
    return {
      headline: "You're making progress",
      message: lowNames
        ? `Prioritize ${lowNames} — a little extra focus there can make a big difference. You've got this.`
        : "Keep going. Small steps lead to big gains. Pick one area to improve and tackle it step by step.",
      variant: 'progress'
    };
  }

  return {
    headline: 'Room to grow',
    message: lowNames
      ? `${lowNames} are your best opportunities right now. Small, consistent steps will get you there — we're rooting for you.`
      : "There's upside in every category. Choose one to improve first, and build from there. You're capable of more.",
    variant: 'growth'
  };
}
