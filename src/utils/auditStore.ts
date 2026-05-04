import type { Transmission } from '../types';

export const AUDIT_BUCKETS_STORAGE_KEY = 'aa2000_kpi_audits_by_department';
export const LEGACY_TRANSMISSIONS_STORAGE_KEY = 'aa2000_kpi_transmissions';

export type AuditBuckets = Record<
  string,
  {
    pending: Transmission[];
    history: Transmission[];
  }
>;

export function createEmptyBuckets(): AuditBuckets {
  return {};
}

export function getOrCreateDeptBucket(buckets: AuditBuckets, dept: string) {
  const key = (dept || 'Unknown').trim() || 'Unknown';
  if (!buckets[key]) buckets[key] = { pending: [], history: [] };
  return buckets[key];
}

export function loadDepartmentBuckets(): AuditBuckets {
  try {
    const raw = localStorage.getItem(AUDIT_BUCKETS_STORAGE_KEY);
    if (!raw) return createEmptyBuckets();
    const parsed = JSON.parse(raw) as AuditBuckets;
    if (!parsed || typeof parsed !== 'object') return createEmptyBuckets();
    return parsed;
  } catch {
    return createEmptyBuckets();
  }
}

export function stripAttachmentPayloadFromTransmission(t: Transmission): Transmission {
  if (!Array.isArray(t.attachments) || t.attachments.length === 0) return t;
  return {
    ...t,
    attachments: t.attachments.map((a) => ({
      name: a.name,
      type: a.type,
      size: a.size,
      // Omit `data` (base64 payload) to keep localStorage within quota.
      // The attachment can be re-hydrated via `storageKey` when needed.
      storageKey: a.storageKey,
    })),
  };
}

function stripBucketsForStorage(buckets: AuditBuckets): AuditBuckets {
  const sanitized: AuditBuckets = {};
  for (const dept of Object.keys(buckets)) {
    const bucket = buckets[dept];
    if (!bucket) continue;
    sanitized[dept] = {
      pending: (bucket.pending || []).map(stripAttachmentPayloadFromTransmission),
      history: (bucket.history || []).map(stripAttachmentPayloadFromTransmission),
    };
  }
  return sanitized;
}

export function saveDepartmentBuckets(buckets: AuditBuckets) {
  try {
    localStorage.setItem(AUDIT_BUCKETS_STORAGE_KEY, JSON.stringify(stripBucketsForStorage(buckets)));
  } catch {
    // Ignore quota exceeded / private-mode errors so React doesn't crash.
  }
}

export function flattenBuckets(buckets: AuditBuckets) {
  const pending: Transmission[] = [];
  const history: Transmission[] = [];
  for (const dept of Object.keys(buckets)) {
    const bucket = buckets[dept];
    if (!bucket) continue;
    if (Array.isArray(bucket.pending)) pending.push(...bucket.pending);
    if (Array.isArray(bucket.history)) history.push(...bucket.history);
  }
  return { pending, history };
}

/**
 * Supervisor dashboards must only see audits for their department.
 * - Prefer the per-department bucket when present (including empty).
 * - If the bucket key is missing (legacy / corrupt store), slice the flattened lists by `Transmission.department`
 *   instead of using unfiltered global pending/history (which would mix all departments).
 */
export function getDepartmentBucketForSupervisor(
  buckets: AuditBuckets,
  department: string,
  flatPending: Transmission[],
  flatHistory: Transmission[]
): { pending: Transmission[]; history: Transmission[] } {
  const key = (department || 'Unknown').trim() || 'Unknown';
  if (Object.prototype.hasOwnProperty.call(buckets, key)) {
    const b = buckets[key];
    return {
      pending: Array.isArray(b?.pending) ? b.pending : [],
      history: Array.isArray(b?.history) ? b.history : [],
    };
  }
  const match = (t: Transmission) => {
    const d = (typeof t.department === 'string' && t.department.trim() ? t.department.trim() : 'Unknown') || 'Unknown';
    return d === key;
  };
  return {
    pending: flatPending.filter(match),
    history: flatHistory.filter(match),
  };
}

export function upsertAudit(
  buckets: AuditBuckets,
  dept: string,
  target: 'pending' | 'history',
  audit: Transmission
) {
  const bucket = getOrCreateDeptBucket(buckets, dept);
  const list = bucket[target];
  const idx = list.findIndex((t) => t.id === audit.id);
  const withDept: Transmission = { ...audit, department: dept };
  if (idx >= 0) list[idx] = withDept;
  else list.unshift(withDept);
}

export function removeAudit(
  buckets: AuditBuckets,
  dept: string,
  target: 'pending' | 'history',
  id: string
) {
  const bucket = getOrCreateDeptBucket(buckets, dept);
  bucket[target] = bucket[target].filter((t) => t.id !== id);
}

export function moveAudit(
  buckets: AuditBuckets,
  dept: string,
  from: 'pending' | 'history',
  to: 'pending' | 'history',
  audit: Transmission
) {
  removeAudit(buckets, dept, from, audit.id);
  upsertAudit(buckets, dept, to, audit);
}

function getDepartmentFromRegistry(registry: any[] | undefined, userId: string): string | undefined {
  if (!Array.isArray(registry)) return undefined;
  const found = registry.find((r) => r?.id === userId);
  const dept = found?.department;
  return typeof dept === 'string' && dept.trim() ? dept : undefined;
}

export function migrateLegacyTransmissionsToBuckets(params: {
  pending: Transmission[];
  history: Transmission[];
  registry?: any[];
}): AuditBuckets {
  const buckets: AuditBuckets = createEmptyBuckets();

  const add = (t: Transmission, target: 'pending' | 'history') => {
    const dept =
      (typeof t.department === 'string' && t.department.trim() ? t.department.trim() : undefined) ||
      getDepartmentFromRegistry(params.registry, t.userId) ||
      'Unknown';
    upsertAudit(buckets, dept, target, { ...t, department: dept });
  };

  for (const t of params.pending || []) add(t, 'pending');
  for (const t of params.history || []) add(t, 'history');

  return buckets;
}

export function loadLegacyTransmissions():
  | { pending: Transmission[]; history: Transmission[] }
  | null {
  try {
    const raw = localStorage.getItem(LEGACY_TRANSMISSIONS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as any;
    const pending = Array.isArray(parsed?.pending) ? parsed.pending : [];
    const history = Array.isArray(parsed?.history) ? parsed.history : [];
    return { pending, history };
  } catch {
    return null;
  }
}

/**
 * Remove duplicate audits by id per department: keep the latest version (by timestamp).
 * If the same id appears in both pending and history, keep it only in the correct list
 * (validated or rejected -> history, else awaiting review -> pending). Persist clean buckets so Ledger Registry
 * and other consumers never see clones.
 */
export function dedupeBuckets(buckets: AuditBuckets): AuditBuckets {
  const out: AuditBuckets = {};
  for (const dept of Object.keys(buckets)) {
    const bucket = buckets[dept];
    if (!bucket) continue;
    const pending = Array.isArray(bucket.pending) ? bucket.pending : [];
    const history = Array.isArray(bucket.history) ? bucket.history : [];
    const byId = new Map<string, Transmission>();
    const add = (t: Transmission) => {
      const existing = byId.get(t.id);
      const ts = new Date(t.timestamp).getTime();
      const existingTs = existing ? new Date(existing.timestamp).getTime() : 0;
      if (!existing || ts >= existingTs) {
        byId.set(t.id, { ...t, department: dept });
      }
    };
    pending.forEach(add);
    history.forEach(add);
    const list = Array.from(byId.values());
    const newPending: Transmission[] = [];
    const newHistory: Transmission[] = [];
    for (const t of list) {
      if (t.status === 'validated' || t.status === 'rejected') newHistory.push(t);
      else newPending.push(t);
    }
    out[dept] = { pending: newPending, history: newHistory };
  }
  return out;
}

/** Distinct rejected rows (pending may contain legacy misplaced rejects). */
export function listRejectedAudits(pending: Transmission[], history: Transmission[]): Transmission[] {
  const seen = new Set<string>();
  const out: Transmission[] = [];
  for (const t of [...pending, ...history]) {
    if (t.status !== 'rejected') continue;
    if (seen.has(t.id)) continue;
    seen.add(t.id);
    out.push(t);
  }
  return out;
}

/** Count distinct rejected audits (may appear in pending or history if store was inconsistent). */
export function countRejectedAudits(pending: Transmission[], history: Transmission[]): number {
  return listRejectedAudits(pending, history).length;
}

export function isAwaitingSupervisorReview(
  t: Pick<Transmission, 'status' | 'supervisorRecommendation'>
): boolean {
  // Pending items are awaiting supervisor review only if:
  // - they are not admin-validated/rejected yet, and
  // - supervisor has not produced a recommendation for them yet.
  return t.status !== 'validated' && t.status !== 'rejected' && !t.supervisorRecommendation;
}

/** Audits still awaiting supervisor review (not validated or rejected). */
export function countPendingReviewAudits(pending: Transmission[]): number {
  return pending.filter(isAwaitingSupervisorReview).length;
}

export function isAwaitingAdminValidation(
  t: Pick<Transmission, 'status' | 'supervisorRecommendation'>
): boolean {
  return t.status !== 'validated' && t.status !== 'rejected' && !!t.supervisorRecommendation;
}

