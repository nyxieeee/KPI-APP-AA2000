import type { CategoryWeightItem, DepartmentWeights, Transmission } from '../types';

export type GradingDepartmentKey = 'Technical' | 'Sales' | 'Accounting' | 'Marketing';

function normalizeCriterionContent(items: CategoryWeightItem[] | undefined): unknown[] {
  if (!items?.length) return [];
  return items.map((c) => ({
    label: c.label,
    weightPct: c.weightPct,
    content: (c.content || []).map((ci) => ({
      label: ci.label,
      maxPoints: ci.maxPoints,
    })),
  }));
}

/** Stable fingerprint of admin Department grading for a department (order, weights, criterion rows). */
export function computeGradingConfigSignature(
  departmentKey: GradingDepartmentKey,
  departmentWeights: DepartmentWeights | undefined
): string {
  const normalized = normalizeCriterionContent(departmentWeights?.[departmentKey]);
  const json = JSON.stringify(normalized);
  let h = 5381;
  for (let i = 0; i < json.length; i++) {
    h = ((h << 5) + h) ^ json.charCodeAt(i);
  }
  return `${departmentKey}:${(h >>> 0).toString(36)}`;
}

/**
 * Pending audit whose stored grading snapshot no longer matches current admin config.
 * Validated/rejected rows are never "expired" for this UI.
 * Records without `gradingConfigSignature` (legacy) are not flagged.
 */
export function isPendingGradingConfigExpired(
  t: Pick<Transmission, 'status' | 'gradingConfigSignature'>,
  departmentKey: GradingDepartmentKey,
  departmentWeights: DepartmentWeights | undefined
): boolean {
  if (t.status === 'validated' || t.status === 'rejected') return false;
  const saved = t.gradingConfigSignature;
  if (saved == null || saved === '') return false;
  return saved !== computeGradingConfigSignature(departmentKey, departmentWeights);
}
