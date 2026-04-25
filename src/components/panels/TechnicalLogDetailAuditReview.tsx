import React from 'react';
import { FileCheck, Wrench } from 'lucide-react';
import type { Transmission, DepartmentWeights, CategoryWeightItem } from '../../types';
import { computeCategoryAggregateMetrics } from '../audit/TechnicalCategoryAuditPanel';
import { getEmployeeCategoryIcon } from '../../utils/employeeCategoryIcons';
import { resolveSalesCategoryWeightItem, getSalesWeightedCategoryOrderDynamic } from '../../utils/technicalWeightedKpi';
import { getGradeForScore, getGradeColorClasses } from '../../utils/gradingSystem';

type ClassificationRow = {
  name: string;
  weight: string;
  icon: React.ComponentType<{ className?: string }>;
  /** When set (e.g. Sales admin label), shown instead of canonical `name`. */
  displayLabel?: string;
};

type DeptKey = 'Technical' | 'Sales' | 'Accounting' | 'Marketing' | 'IT';

type Props = {
  selectedLog: Transmission;
  /** Which slice of `departmentWeights` to use (default Technical). */
  departmentKey?: DeptKey;
  departmentWeights?: DepartmentWeights;
  CLASSIFICATIONS: ClassificationRow[];
  CHECKLIST_CONTENT?: Record<string, string[]>;
  getReviewTotalScoreLegacy: (category: string, checklist: unknown) => number;
  handleDownload: (file: { name: string; data?: string }) => void;
};

/**
 * Renders category/criterion breakdown from `allSalesData` using admin Department grading breakdown
 * when present; otherwise legacy CHECKLIST_CONTENT + checklist parsing.
 */
export function TechnicalLogDetailAuditReview({
  selectedLog,
  departmentKey = 'Technical',
  departmentWeights,
  CLASSIFICATIONS,
  CHECKLIST_CONTENT = {},
  getReviewTotalScoreLegacy,
  handleDownload,
}: Props) {
  const allData = selectedLog.allSalesData || {};
  const deptWeightsList =
    departmentKey === 'Sales'
      ? undefined
      : (departmentWeights?.[departmentKey] as CategoryWeightItem[] | undefined);
  const categoryOrder =
    departmentKey === 'Sales'
      ? getSalesWeightedCategoryOrderDynamic(departmentWeights)
      : deptWeightsList?.length
        ? deptWeightsList.map((c) => c.label)
        : Object.keys(allData);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <FileCheck className="w-4 h-4 text-white" />
        </div>
        <p className="text-[10px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Detailed Audit Review</p>
      </div>
      {categoryOrder.map((category) => {
        const catData = allData[category] || { checklist: {} };
        const checklist = (catData.checklist || {}) as Record<string, unknown>;
        const catCfg =
          departmentKey === 'Sales'
            ? resolveSalesCategoryWeightItem(category, departmentWeights)
            : deptWeightsList?.find((w) => w.label === category);
        const displayCategoryName =
          departmentKey === 'Sales'
            ? CLASSIFICATIONS.find((c) => c.name === category)?.displayLabel ?? category
            : category;
        const Icon = getEmployeeCategoryIcon(catCfg?.icon);
        const snapshotEntry = selectedLog.ratings?.logDetailSnapshot?.find((s) => s.name === category);
        const weightPct =
          snapshotEntry?.weightPct ??
          catCfg?.weightPct ??
          parseInt(CLASSIFICATIONS.find((c) => c.name === category)?.weight || '0', 10) ??
          0;

        if (catCfg?.content?.length) {
          const m = computeCategoryAggregateMetrics(catCfg, checklist as any);
          const weightedDisplay = `+${m.weightedImpactPct.toFixed(2)}%`;
          const aggLabel = `${Number.isInteger(m.aggregatePts) ? m.aggregatePts : m.aggregatePts.toFixed(1)} / ${m.categorymaxpoints} pts`;

          const pct = m.categorymaxpoints > 0 ? (m.aggregatePts / m.categorymaxpoints) * 100 : 0;
          const gradeInfo = getGradeForScore(pct);
          const cls = getGradeColorClasses(gradeInfo.color);
          return (
            <div key={category} className="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="w-full px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">{displayCategoryName}</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">
                      {weightPct}% weight · {aggLabel}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <p className="text-base font-black text-blue-600">{weightedDisplay}</p>
                  <div className={`px-2 py-0.5 rounded-full border ${cls.bg} ${cls.text} ${cls.border} flex flex-col items-center leading-none`}>
                    <span className="text-xs font-black">{gradeInfo.letter}</span>
                    <span className="text-[7px] uppercase font-bold tracking-tighter">{gradeInfo.label}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        const totalScore = getReviewTotalScoreLegacy(category, checklist);
        const weightedScore = (totalScore * (weightPct / 100)).toFixed(2);
        const FallbackIcon = CLASSIFICATIONS.find((c) => c.name === category)?.icon || Wrench;

        const gradeInfoLegacy = getGradeForScore(totalScore);
        const clsLegacy = getGradeColorClasses(gradeInfoLegacy.color);
        return (
          <div key={category} className="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="w-full px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center shrink-0">
                  <FallbackIcon className="w-4 h-4 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">{displayCategoryName}</h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{weightPct}% weight</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <p className="text-base font-black text-blue-600">{weightedScore}%</p>
                <div className={`px-2 py-0.5 rounded-full border ${clsLegacy.bg} ${clsLegacy.text} ${clsLegacy.border} flex flex-col items-center leading-none`}>
                  <span className="text-xs font-black">{gradeInfoLegacy.letter}</span>
                  <span className="text-[7px] uppercase font-bold tracking-tighter">{gradeInfoLegacy.label}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

