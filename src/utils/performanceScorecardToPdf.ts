import { jsPDF } from 'jspdf';
import { drawAppLogoFallback } from './pdfCommon';

const BORDER_INSET = 8;
const MARGIN = 20;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;
const CONTENT_LEFT = BORDER_INSET + 2;
const CONTENT_BOX_WIDTH = PAGE_WIDTH - 2 * BORDER_INSET - 4;

const colors = {
  slate: {
    900: [15, 23, 42] as [number, number, number],
    800: [30, 41, 59] as [number, number, number],
    700: [51, 65, 85] as [number, number, number],
    500: [100, 116, 139] as [number, number, number],
    300: [203, 213, 225] as [number, number, number],
    200: [226, 232, 240] as [number, number, number],
    100: [241, 245, 249] as [number, number, number],
    50: [248, 250, 252] as [number, number, number],
  },
  blue: { 600: [29, 78, 216] as [number, number, number], 50: [239, 246, 255] as [number, number, number] }, /* logo brand #1d4ed8 */
  emerald: { 600: [5, 150, 105] as [number, number, number], 50: [236, 253, 245] as [number, number, number] },
  amber: { 700: [180, 83, 9] as [number, number, number], 50: [255, 251, 235] as [number, number, number] },
};

const FOOTER_TEXT =
  '© 2026 AA2000. All rights reserved. This document is an official record and must not be altered, modified, or tampered with in any way.';

export interface PerformanceCategoryForPdf {
  label: string;
  name: string;
  weightPct: number;
  avgPct: number | undefined; // 0..100
}

export interface QuarterPerformanceForPdf {
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  count: number;
  finalScore: number | undefined; // 0..100
  categories: PerformanceCategoryForPdf[];
}

export interface PerformanceScorecardPdfOptions {
  employeeName: string;
  department: string;
  year: number;
  quarters: QuarterPerformanceForPdf[];
  logoDataUrl?: string;
}

export function getPerformanceScorecardPdfFilename(opts: PerformanceScorecardPdfOptions): string {
  const safe = (s: string) => String(s || '').replace(/[^\w\-]+/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
  return `${safe(opts.employeeName)}_${safe(opts.department)}_${opts.year}_Performance_Scorecard.pdf`;
}

function drawPageBorder(pdf: jsPDF) {
  const x = BORDER_INSET;
  const y = BORDER_INSET;
  const w = PAGE_WIDTH - 2 * BORDER_INSET;
  const h = PAGE_HEIGHT - 2 * BORDER_INSET;
  pdf.setDrawColor(...colors.slate[300]);
  pdf.setLineWidth(0.4);
  pdf.rect(x, y, w, h);
  pdf.setDrawColor(...colors.slate[200]);
  pdf.setLineWidth(0.2);
  pdf.rect(x + 2, y + 2, w - 4, h - 4);
}

function drawFooterOnPage(pdf: jsPDF) {
  const footerY = PAGE_HEIGHT - 12;
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...colors.slate[500]);
  pdf.text(FOOTER_TEXT, PAGE_WIDTH / 2, footerY, { align: 'center' });
}

function addSectionTitle(pdf: jsPDF, y: number, title: string): number {
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...colors.slate[700]);
  pdf.text(title.toUpperCase(), MARGIN, y);
  return y + 6;
}

function addLine(pdf: jsPDF, y: number): number {
  pdf.setDrawColor(...colors.slate[200]);
  pdf.setLineWidth(0.2);
  pdf.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  return y + 5;
}

function addKeyValue(pdf: jsPDF, x: number, y: number, key: string, value: string, valueBold = false): number {
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...colors.slate[500]);
  pdf.text(key, x, y);
  pdf.setFont('helvetica', valueBold ? 'bold' : 'normal');
  pdf.setTextColor(...colors.slate[900]);
  const lines = pdf.splitTextToSize(String(value ?? ''), CONTENT_WIDTH - (x - MARGIN) - 50);
  pdf.text(lines, x + 45, y);
  return y + lines.length * 4 + 2;
}

function ensureSpace(pdf: jsPDF, y: number, requiredH: number): number {
  if (y + requiredH <= PAGE_HEIGHT - 18) return y;
  pdf.addPage();
  drawPageBorder(pdf);
  drawFooterOnPage(pdf);
  return MARGIN;
}

function drawFinalScoreBlock(pdf: jsPDF, y: number, finalScore: number): number {
  const h = 26;
  y = ensureSpace(pdf, y, h + 6);
  const quotaMet = finalScore >= 90;
  pdf.setFillColor(...colors.slate[100]);
  pdf.rect(MARGIN, y, CONTENT_WIDTH, h, 'F');
  pdf.setDrawColor(...colors.slate[200]);
  pdf.setLineWidth(0.25);
  pdf.rect(MARGIN, y, CONTENT_WIDTH, h, 'S');
  pdf.setDrawColor(...(quotaMet ? colors.emerald[600] : colors.blue[600]));
  pdf.setLineWidth(0.6);
  pdf.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y);
  pdf.setLineWidth(0.25);
  pdf.setDrawColor(...colors.slate[200]);

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...colors.slate[700]);
  pdf.text('Official performance score', MARGIN + 6, y + 10);

  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...colors.slate[900]);
  const scoreText = `${Math.round(finalScore)}%`;
  pdf.text(scoreText, PAGE_WIDTH - MARGIN - 26, y + 12, { align: 'right' });

  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...(quotaMet ? colors.emerald[600] : colors.slate[500]));
  pdf.text(quotaMet ? 'Quota met' : 'Below target', PAGE_WIDTH - MARGIN - 26, y + 20, { align: 'right' });

  return y + h + 6;
}

function drawCategoryTable(pdf: jsPDF, y: number, categories: PerformanceCategoryForPdf[]): number {
  const rowH = 9;
  const headerH = 9;
  const tableW = CONTENT_WIDTH;
  const x = MARGIN;
  const colNameW = tableW - 24 - 22; // name, weight, score
  const colWeightW = 24;
  const colScoreW = 22;
  const totalH = headerH + categories.length * rowH + 2;
  y = ensureSpace(pdf, y, totalH + 4);

  // Header
  pdf.setFillColor(...colors.slate[50]);
  pdf.rect(x, y, tableW, headerH, 'F');
  pdf.setDrawColor(...colors.slate[200]);
  pdf.setLineWidth(0.25);
  pdf.rect(x, y, tableW, headerH, 'S');
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...colors.slate[700]);
  pdf.text('Category', x + 2, y + 6);
  pdf.text('Weight', x + colNameW + 2, y + 6);
  pdf.text('Avg', x + colNameW + colWeightW + 2, y + 6);

  let yy = y + headerH;
  pdf.setFont('helvetica', 'normal');
  for (const c of categories) {
    pdf.setDrawColor(...colors.slate[200]);
    pdf.setLineWidth(0.2);
    pdf.line(x, yy, x + tableW, yy);
    pdf.setTextColor(...colors.slate[900]);
    pdf.text(String(c.name ?? ''), x + 2, yy + 6);
    pdf.setTextColor(...colors.slate[700]);
    pdf.text(`${Math.round(c.weightPct)}%`, x + colNameW + 2, yy + 6);
    const scoreText = c.avgPct == null || !Number.isFinite(c.avgPct) ? '—' : `${Math.round(c.avgPct)}%`;
    pdf.setTextColor(...colors.slate[900]);
    pdf.text(scoreText, x + colNameW + colWeightW + 2, yy + 6);
    yy += rowH;
  }

  // Borders
  pdf.setDrawColor(...colors.slate[200]);
  pdf.setLineWidth(0.25);
  pdf.rect(x, y, tableW, headerH + categories.length * rowH + 2, 'S');
  pdf.line(x + colNameW, y, x + colNameW, yy);
  pdf.line(x + colNameW + colWeightW, y, x + colNameW + colWeightW, yy);

  return yy + 4;
}

export function downloadPerformanceScorecardPdf(opts: PerformanceScorecardPdfOptions): void {
  if (!opts || !opts.employeeName) throw new Error('Missing PDF options');

  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  drawPageBorder(pdf);

  // Logo row (same as log detail PDF)
  const logoRowH = 20;
  const logoMm = 14;
  const logoX = (PAGE_WIDTH - logoMm) / 2;
  const logoY = BORDER_INSET + 2 + (logoRowH - logoMm) / 2;
  if (opts.logoDataUrl) {
    try {
      pdf.addImage(opts.logoDataUrl, 'PNG', logoX, logoY, logoMm, logoMm);
    } catch {
      drawAppLogoFallback(pdf, logoX + logoMm / 2, logoY + logoMm / 2, logoMm);
    }
  } else {
    drawAppLogoFallback(pdf, logoX + logoMm / 2, logoY + logoMm / 2, logoMm);
  }
  let y = BORDER_INSET + 2 + logoRowH;

  // Header block (match log detail: content area, slate[50], bottom line, multi-color tagline)
  const headerH = 24;
  pdf.setFillColor(...colors.slate[50]);
  pdf.rect(CONTENT_LEFT, y, CONTENT_BOX_WIDTH, headerH, 'F');
  pdf.setDrawColor(...colors.slate[200]);
  pdf.setLineWidth(0.25);
  pdf.line(CONTENT_LEFT, y + headerH, CONTENT_LEFT + CONTENT_BOX_WIDTH, y + headerH);
  const tagline = 'AA2000 KPI Performance Scorecard';
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  const xStart = PAGE_WIDTH / 2 - pdf.getTextWidth(tagline) / 2;
  pdf.setTextColor(30, 58, 138);
  pdf.text('AA', xStart, y + 9);
  pdf.setTextColor(...colors.blue[600]);
  pdf.text('2000', xStart + pdf.getTextWidth('AA'), y + 9);
  pdf.setTextColor(...colors.slate[700]);
  pdf.text(' KPI Performance Scorecard', xStart + pdf.getTextWidth('AA2000'), y + 9);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...colors.slate[500]);
  pdf.text(`Year: ${opts.year}`, MARGIN, y + 17);
  pdf.setFontSize(8);
  pdf.text(`Generated: ${new Date().toLocaleString()}`, PAGE_WIDTH - MARGIN - 52, y + 17);
  y += headerH + 6;

  y = addSectionTitle(pdf, y, 'Employee summary');
  y = addLine(pdf, y);
  y = addKeyValue(pdf, MARGIN, y, 'Employee', opts.employeeName || '—', true) + 1;
  y = addKeyValue(pdf, MARGIN, y, 'Department', opts.department || '—', true) + 4;

  opts.quarters.forEach((q, index) => {
    if (index > 0) y += 14;
    y = ensureSpace(pdf, y, 12);
    y = addSectionTitle(pdf, y, `${q.quarter} performance`);
    y = addLine(pdf, y);

    if (!q.count || q.count === 0 || q.finalScore == null || !Number.isFinite(q.finalScore)) {
      pdf.setFillColor(...colors.blue[50]);
      pdf.rect(MARGIN, y, CONTENT_WIDTH, 14, 'F');
      pdf.setDrawColor(...colors.slate[200]);
      pdf.setLineWidth(0.25);
      pdf.rect(MARGIN, y, CONTENT_WIDTH, 14, 'S');
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...colors.slate[700]);
      pdf.text('No data recorded', MARGIN + 6, y + 9);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...colors.slate[500]);
      pdf.text('No validated audits found for this quarter.', MARGIN + 6, y + 12.5);
      y += 18;
      return;
    }

    y = drawFinalScoreBlock(pdf, y, Number(q.finalScore));
    y = drawCategoryTable(pdf, y, q.categories || []);
    y += 2;
  });

  // Draw footer on every page (same as log detail PDF)
  const totalPages = pdf.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    drawFooterOnPage(pdf);
  }

  // Download via Blob + link (reliable)
  const filename = getPerformanceScorecardPdfFilename(opts);
  const blob = pdf.output('blob') as Blob;
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
    link.remove();
  }, 0);
}

