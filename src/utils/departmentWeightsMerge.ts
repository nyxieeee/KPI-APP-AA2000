import type { DepartmentWeights } from '../types';

/**
 * Detect the old auto-generated default criterion UI pattern:
 * elements = [textboxButton, basicGradingSystem with single {min:0,max:null,score:maxpoints}].
 */
function isDefaultGeneratedElements(elements: unknown[], maxpoints: number): boolean {
  if (!Array.isArray(elements) || elements.length !== 2) return false;
  const [a, b] = elements as any[];
  if (a?.type !== 'textboxButton') return false;
  if (b?.type !== 'basicGradingSystem') return false;
  const cps = b?.checkpoints;
  if (!Array.isArray(cps) || cps.length !== 1) return false;
  const cp = cps[0];
  return cp?.min === 0 && (cp?.max === null || cp?.max === undefined) && Number(cp?.score) === maxpoints;
}

/** Strip old auto-generated basicGradingSystem from stored criteria so all dashboards use direct score entry. */
export function migrateStoredDepartmentWeights(weights: DepartmentWeights): DepartmentWeights {
  const out: DepartmentWeights = {};
  for (const dept of Object.keys(weights)) {
    out[dept] = (weights[dept] || []).map((cat) => ({
      ...cat,
      content: (cat.content || []).map((item) => {
        const elements = (item as any)?.ui?.elements;
        const maxpoints = Math.max(0, Number(item?.maxpoints) || 0);
        if (Array.isArray(elements) && isDefaultGeneratedElements(elements, maxpoints)) {
          return { ...item, ui: { ...((item as any).ui || {}), elements: [] } };
        }
        return item;
      }),
    }));
  }
  return out;
}

/** Merge migrated stored weights with bundled program defaults so every dept/category has criterion content. */
export function mergeDepartmentWeightsWithProgramDefaults(
  migrated: DepartmentWeights,
  programDefaults: DepartmentWeights
): DepartmentWeights {
  const merged: DepartmentWeights = { ...programDefaults };
  for (const dept of Object.keys(programDefaults)) {
    const storedDept = migrated[dept];
    if (!storedDept || storedDept.length === 0) {
      merged[dept] = programDefaults[dept];
    } else {
      const defaultDept = programDefaults[dept] ?? [];
      merged[dept] = storedDept.map((cat, idx) => {
        const hasContent = Array.isArray(cat.content) && cat.content.length > 0;
        if (hasContent) return cat;
        const defaultCat = defaultDept.find((d) => d.label === cat.label) ?? defaultDept[idx];
        return { ...cat, content: defaultCat?.content ?? cat.content };
      });
    }
  }
  return merged;
}
