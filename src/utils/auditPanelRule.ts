/**
 * Canonical "panel rule" layout for Department grading breakdown (admin preview + employee dashboards).
 * Keep in sync with `.cursor/rules/panel-rule.mdc`.
 *
 * **Chevron press-and-hold** for criteria panels: use `useAuditPanelCategoryHold()` from `./auditPanelHold`
 * (or `startAuditPanelHold` + `stopAuditPanelHold` + `subscribeAuditPanelHoldGlobalStop` if sharing a ref
 * with other hold logic). Do not reimplement interval-based repeats — first repeat must be at 1s, not 1s + interval.
 *
 * Admin configures `CategoryContentItem[]` per category; any dashboard that renders that list as cards
 * should use `AUDIT_PANEL_CRITERIA_GRID_CLASS` + `auditPanelCriterionColSpan` so layout matches employee UIs.
 *
 * Within a single criterion panel:
 * - Max 2 inputs per row (md+).
 * - 1 input → full width.
 * - Odd count (3, 5, …): first input full width; remaining in rows of 2.
 * - Checkbox tiles use the same grid as textbox tiles (each tile = one "input").
 */

/** Grid for inputs inside a criterion (textbox tiles or checkbox tiles). */
export const AUDIT_PANEL_INPUT_GRID_CLASS = 'grid w-full grid-cols-1 gap-3 md:grid-cols-2';

/** Body wrapper: centers criterion controls per panel rule. */
export const AUDIT_PANEL_CRITERION_BODY_CLASS =
  'flex w-full flex-col items-center justify-center gap-4';

/** Column span for item at `pos` (0-based) when there are `totalInputs` tiles. */
export function auditPanelInputColSpan(pos: number, totalInputs: number): string {
  if (totalInputs <= 0) return '';
  if (totalInputs === 1) return 'md:col-span-2';
  const odd = totalInputs % 2 === 1;
  if (odd && pos === 0) return 'md:col-span-2';
  return 'md:col-span-1';
}

/** Grid wrapping multiple criterion panels in one category (max 2 per row on lg+). */
export const AUDIT_PANEL_CRITERIA_GRID_CLASS =
  'grid w-full grid-cols-1 items-stretch gap-6 justify-items-stretch lg:grid-cols-2';

/** Same odd/even rule as inputs: 1 full width; odd → first full width; else 2 per row. Uses `lg:` to match `AUDIT_PANEL_CRITERIA_GRID_CLASS`. */
export function auditPanelCriterionColSpan(pos: number, totalCriteria: number): string {
  if (totalCriteria <= 0) return '';
  if (totalCriteria === 1) return 'lg:col-span-2';
  const odd = totalCriteria % 2 === 1;
  if (odd && pos === 0) return 'lg:col-span-2';
  return 'lg:col-span-1';
}

/** Textbox field label: left-aligned (panel rule). */
export const AUDIT_PANEL_TEXTBOX_LABEL_CLASS = 'w-full text-left text-[12px] font-black text-slate-900';
