/**
 * Configurable scoring from an employee-entered numeric value (e.g. textbox count).
 * Each checkpoint: if value is between min and max (inclusive), that score is a candidate;
 * the highest matching score wins. Caps to criterion max points.
 */

export type GradingCheckpoint = {
  /** Inclusive lower bound (employee value >= min). */
  min: number;
  /** Inclusive upper bound; null means no upper limit. */
  max: number | null;
  /** Points awarded when this range matches (if it is the best match). */
  score: number;
};

export type BasicGradingSystemElement = {
  type: 'basicGradingSystem';
  /** Numeric tiers for textbox + button (employee number → points). Used when there is a single textbox, and as fallback when `perTextboxCheckpoints` is missing. */
  checkpoints: GradingCheckpoint[];
  /**
   * When multiple `textboxButton` elements exist in the same criterion, checkpoint lists in canvas order
   * (same order as textbox rows in `ui.elements`). Ordinal `i` matches the i-th textbox.
   */
  perTextboxCheckpoints?: GradingCheckpoint[][];
  /** Points per checkbox when checked (same order as `checkbox` elements in the panel). Used when the panel uses checkboxes, not textbox. */
  checkboxScores?: number[];
  /** Legacy — migrated to `checkpoints` when loading. */
  tierCutoffs?: [number, number, number];
};

/** Same checkpoint shape as textbox grading: MIN/MAX = inclusive count of checkboxes checked (0 … N). */
export type CheckboxGradingSystemElement = {
  type: 'checkboxGradingSystem';
  checkpoints: GradingCheckpoint[];
};

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

export function sanitizeCheckpoint(c: Partial<GradingCheckpoint>): GradingCheckpoint {
  const min = Number.isFinite(Number(c.min)) ? Number(c.min) : 0;
  const score = Number.isFinite(Number(c.score)) ? Math.max(0, Number(c.score)) : 0;
  let max: number | null = null;
  if (c.max !== null && c.max !== undefined && String(c.max).trim() !== '') {
    const m = Number(c.max);
    if (Number.isFinite(m)) max = m;
  }
  if (max !== null && max < min) max = min;
  return { min, max, score };
}

/** Legacy tier cutoffs (ascending 0–100 style bands) → checkpoint ranges. */
export function migrateTierCutoffsToCheckpoints(
  tierCutoffs: [number, number, number],
  maxPointsCap: number
): GradingCheckpoint[] {
  const cap = Math.max(0, Math.round(maxPointsCap));
  const t = [...tierCutoffs].map((x) => clamp(Number(x) || 0, 0, 100)).sort((a, b) => a - b);
  const [t0, t1, t2] = t;
  const s1 = Math.round(cap / 3);
  const s2 = Math.round((2 * cap) / 3);
  return [
    { min: 0, max: t0, score: 0 },
    { min: t0 + 1, max: t1, score: s1 },
    { min: t1 + 1, max: t2, score: s2 },
    { min: t2 + 1, max: null, score: cap },
  ];
}

export function normalizeCheckboxGradingSystemFromRaw(el: any, _maxPointsCap: number): CheckboxGradingSystemElement {
  if (el && Array.isArray(el.checkpoints) && el.checkpoints.length > 0) {
    return {
      type: 'checkboxGradingSystem',
      checkpoints: el.checkpoints.map((c: any) => sanitizeCheckpoint(c)),
    };
  }
  return {
    type: 'checkboxGradingSystem',
    checkpoints: [{ min: 0, max: 0, score: 0 }],
  };
}

function sanitizePerTextboxCheckpoints(raw: unknown): GradingCheckpoint[][] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: GradingCheckpoint[][] = [];
  for (const row of raw) {
    if (!Array.isArray(row)) continue;
    out.push(row.map((c: any) => sanitizeCheckpoint(c)));
  }
  return out.length ? out : undefined;
}

/** Checkpoints for the t-th textbox on the criterion (0-based, canvas order). */
export function checkpointsForTextboxOrdinal(
  basic: BasicGradingSystemElement | undefined,
  textboxOrdinal: number
): GradingCheckpoint[] {
  if (!basic) return [];
  const per = basic.perTextboxCheckpoints;
  if (per && per[textboxOrdinal]?.length) return per[textboxOrdinal]!;
  return basic.checkpoints || [];
}

/** Stable JSON for dirty-check / snapshots (admin). */
export function gradingCheckpointsStableJson(checkpoints: GradingCheckpoint[] | undefined): string {
  const list = checkpoints ?? [];
  const norm = list.map((x) => {
    let min = Number.isFinite(Number(x.min)) ? Number(x.min) : 0;
    let max: number | null = x.max;
    if (max !== null && max !== undefined && String(max).trim() !== '') {
      max = Number(max);
      if (!Number.isFinite(max)) max = min;
      if (max < min) max = min;
    } else {
      max = null;
    }
    const score = Math.max(0, Math.min(1000, Number(x.score) || 0));
    return { min, max, score };
  });
  return JSON.stringify(norm);
}

export function snapshotBasicGradingForTextboxCount(
  basic: BasicGradingSystemElement,
  textboxCount: number
): string {
  if (textboxCount <= 1) {
    return JSON.stringify({ v: 1 as const, checkpoints: JSON.parse(gradingCheckpointsStableJson(basic.checkpoints)) });
  }
  const per = Array.from({ length: textboxCount }, (_, t) =>
    JSON.parse(gradingCheckpointsStableJson(checkpointsForTextboxOrdinal(basic, t)))
  );
  return JSON.stringify({ v: 2 as const, per });
}

export function normalizeBasicGradingSystemFromRaw(el: any, maxPointsCap: number): BasicGradingSystemElement {
  const checkboxScores = Array.isArray(el?.checkboxScores)
    ? (el.checkboxScores as unknown[]).map((n) => Math.max(0, Number(n) || 0))
    : [];
  const perTextboxCheckpoints = sanitizePerTextboxCheckpoints(el?.perTextboxCheckpoints);
  if (el && Array.isArray(el.checkpoints) && el.checkpoints.length > 0) {
    return {
      type: 'basicGradingSystem',
      checkpoints: el.checkpoints.map((c: any) => sanitizeCheckpoint(c)),
      ...(perTextboxCheckpoints ? { perTextboxCheckpoints } : {}),
      checkboxScores,
    };
  }
  const t = el?.tierCutoffs ?? [40, 70, 85];
  const arr: [number, number, number] = [
    Number(t[0] ?? 40),
    Number(t[1] ?? 70),
    Number(t[2] ?? 85),
  ];
  return {
    type: 'basicGradingSystem',
    checkpoints: migrateTierCutoffsToCheckpoints(arr, maxPointsCap),
    checkboxScores,
    ...(perTextboxCheckpoints ? { perTextboxCheckpoints } : {}),
  };
}

export function maxScoreFromCheckpointList(checkpoints: GradingCheckpoint[] | undefined): number {
  const list = checkpoints ?? [];
  return list.reduce((m, c) => Math.max(m, Math.max(0, Number(c.score) || 0)), 0);
}

/** Sum points for checked boxes; result capped to maxPointsCap. */
export function scoreFromCheckboxSelections(
  scores: number[] | undefined,
  checked: boolean[],
  maxPointsCap: number
): number {
  const cap = Math.max(0, Number(maxPointsCap) || 0);
  const s = scores ?? [];
  let sum = 0;
  for (let i = 0; i < checked.length; i++) {
    if (checked[i]) sum += Math.max(0, Number(s[i]) || 0);
  }
  return Math.min(cap, sum);
}

/**
 * Score from employee input: among all checkpoints where min <= value <= max (or max is null),
 * take the maximum score, then clamp to [0, maxPointsCap].
 */
export function scoreFromEmployeeInput(
  rawInput: number,
  checkpoints: GradingCheckpoint[] | undefined | null,
  maxPointsCap: number
): number {
  const cap = Math.max(0, Number(maxPointsCap) || 0);
  const v = Number(rawInput);
  if (!Number.isFinite(v)) return 0;
  const list = checkpoints?.length ? checkpoints : [];
  let best = 0;
  for (const c of list) {
    const lo = Number.isFinite(Number(c.min)) ? Number(c.min) : 0;
    const hi = c.max === null || c.max === undefined ? Infinity : Number(c.max);
    const hiOk = Number.isFinite(hi) ? hi : Infinity;
    if (v >= lo && v <= hiOk) {
      const s = Math.max(0, Number(c.score) || 0);
      if (s > best) best = s;
    }
  }
  return Math.min(cap, best);
}
