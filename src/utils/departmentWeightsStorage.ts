import type { DepartmentWeights } from '../types';

export const DEPARTMENT_WEIGHTS_STORAGE_KEY = 'aa2000_kpi_department_weights';

/** Bump when bundled default categories/weights change so clients replace stale localStorage once. */
export const DEPARTMENT_WEIGHTS_SCHEMA_STORAGE_KEY = 'aa2000_kpi_department_weights_schema_v';
export const CURRENT_DEPARTMENT_WEIGHTS_SCHEMA = 2;

export function readDepartmentWeightsSchemaVersion(): number {
  try {
    const raw = localStorage.getItem(DEPARTMENT_WEIGHTS_SCHEMA_STORAGE_KEY);
    if (raw == null || raw === '') return 0;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export function writeDepartmentWeightsSchemaVersion(version: number): void {
  try {
    localStorage.setItem(DEPARTMENT_WEIGHTS_SCHEMA_STORAGE_KEY, String(version));
  } catch {
    /* ignore */
  }
}

export function saveDepartmentWeightsToStorage(weights: DepartmentWeights): void {
  try {
    localStorage.setItem(DEPARTMENT_WEIGHTS_STORAGE_KEY, JSON.stringify(weights));
  } catch {
    // ignore quota / private mode
  }
}

export function loadDepartmentWeightsFromStorage(): DepartmentWeights | null {
  try {
    const raw = localStorage.getItem(DEPARTMENT_WEIGHTS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DepartmentWeights;
    if (parsed && typeof parsed === 'object') return parsed;
    return null;
  } catch {
    return null;
  }
}
