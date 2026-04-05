import { jsPDF } from 'jspdf';
import type { Transmission } from '../types';
import { getGradeForScore } from './gradingSystem';

const BORDER_INSET = 8;
const MARGIN = 20;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;

type Rgb = [number, number, number];

const colors = {
  slate: {
    900: [15, 23, 42] as Rgb,
    800: [30, 41, 59] as Rgb,
    700: [51, 65, 85] as Rgb,
    500: [100, 116, 139] as Rgb,
    300: [203, 213, 225] as Rgb,
    200: [226, 232, 240] as Rgb,
    100: [241, 245, 249] as Rgb,
    50: [248, 250, 252] as Rgb,
  },
  emerald: { 600: [5, 150, 105] as Rgb, 50: [236, 253, 245] as Rgb },
  red: { 600: [220, 38, 38] as Rgb, 50: [254, 242, 242] as Rgb },
  blue: { 600: [29, 78, 216] as Rgb, 50: [239, 246, 255] as Rgb }, /* logo brand #1d4ed8 */
  amber: { 700: [180, 83, 9] as Rgb, 100: [254, 243, 199] as Rgb, 50: [255, 251, 235] as Rgb },
};

export function drawAppLogoFallback(pdf: jsPDF, centerX: number, centerY: number, sizeMm: number) {
  const rOuter = sizeMm / 2;
  const rInner = rOuter * 0.72;
  const rIris = rOuter * 0.56;
  const rReflect = rOuter * 0.22;

  // Outer thin ring (approx of Logo.tsx ring-grad-1)
  pdf.setDrawColor(14, 165, 233);
  pdf.setLineWidth(0.9);
  pdf.circle(centerX, centerY, rOuter - 0.4, 'S');

  // Inner thicker ring (approx of Logo.tsx ring-grad-2)
  pdf.setDrawColor(56, 189, 248);
  pdf.setLineWidth(2.2);
  pdf.circle(centerX, centerY, rInner, 'S');

  // Iris (approx of Logo.tsx eye-iris-grad)
  pdf.setFillColor(3, 105, 161);
  pdf.circle(centerX, centerY, rIris, 'F');
  pdf.setFillColor(30, 64, 175);
  pdf.circle(centerX, centerY, rIris * 0.62, 'F');
  pdf.setFillColor(12, 74, 110);
  pdf.circle(centerX, centerY, rIris * 0.38, 'F');

  // Light reflection (approx of Logo.tsx reflect-grad)
  pdf.setFillColor(125, 211, 252);
  pdf.circle(centerX - rOuter * 0.18, centerY - rOuter * 0.18, rReflect, 'F');
  pdf.setFillColor(255, 255, 255);
  pdf.circle(centerX - rOuter * 0.26, centerY - rOuter * 0.26, rReflect * 0.35, 'F');
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

const FOOTER_TEXT =
  '© 2026 AA2000. All rights reserved. This document is an official record and must not be altered, modified, or tampered with in any way.';

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

function addBlock(pdf: jsPDF, y: number, fillRgb: [number, number, number], textRgb: [number, number, number], title: string, subtitle: string): number {
  const h = 18;
  pdf.setFillColor(...fillRgb);
  pdf.rect(MARGIN, y, CONTENT_WIDTH, h, 'F');
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...textRgb);
  pdf.text(title, MARGIN + 4, y + 8);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(subtitle, MARGIN + 4, y + 14);
  return y + h + 6;
}

const PANEL_TABLE_COL1_WIDTH = CONTENT_WIDTH - 22;
const PANEL_TABLE_COL2_WIDTH = 18;
const PANEL_HEADER_HEIGHT = 8;
const PANEL_CELL_HEIGHT = 8;

function drawPanelTable(pdf: jsPDF, startY: number, rows: { name: string; score: string }[]): number {
  if (rows.length === 0) return startY;
  const left = MARGIN;
  const col1End = left + PANEL_TABLE_COL1_WIDTH;
  const col2End = left + PANEL_TABLE_COL1_WIDTH + PANEL_TABLE_COL2_WIDTH;
  const headerY = startY + 4;
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...colors.slate[700]);
  pdf.text('Responsibilities', left + 2, headerY);
  pdf.text('Score', col1End + 2, headerY);
  pdf.setDrawColor(...colors.slate[200]);
  pdf.setLineWidth(0.2);
  pdf.line(left, startY + PANEL_HEADER_HEIGHT, col2End, startY + PANEL_HEADER_HEIGHT);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...colors.slate[700]);
  let y = startY + PANEL_HEADER_HEIGHT;
  for (const row of rows) {
    const nameLines = pdf.splitTextToSize(row.name, PANEL_TABLE_COL1_WIDTH - 4);
    const lineHeight = 4;
    const textBlockHeight = nameLines.length * lineHeight;
    const textY = y + Math.max(2, (PANEL_CELL_HEIGHT - textBlockHeight) / 2 + lineHeight);
    pdf.text(nameLines, left + 2, textY);
    pdf.text(row.score, col1End + 2, y + PANEL_CELL_HEIGHT / 2 + 1.5);
    pdf.line(left, y + PANEL_CELL_HEIGHT, col2End, y + PANEL_CELL_HEIGHT);
    y += PANEL_CELL_HEIGHT;
  }
  pdf.line(col1End, startY, col1End, y);
  pdf.rect(left, startY, PANEL_TABLE_COL1_WIDTH + PANEL_TABLE_COL2_WIDTH, y - startY + 2, 'S');
  return y + 4;
}

function categoryScoreFromData(catData: Record<string, unknown>): { total: number; details: string[] } {
  const checklist = (catData.checklist as Record<string, unknown>) || {};
  const details: string[] = [];
  let total = 0;
  Object.entries(checklist).forEach(([key, val]) => {
    if (val && typeof val === 'object' && (val as Record<string, unknown>).score !== undefined) {
      const s = Number((val as Record<string, unknown>).score) || 0;
      total += s;
      details.push(`${key}: ${s}`);
    } else if (typeof val === 'number') {
      total += val;
      details.push(`${key}: ${val}`);
    }
  });
  if (catData.revenue != null) details.push(`Revenue: ${catData.revenue}`);
  if (catData.accountsClosed != null) details.push(`Accounts: ${catData.accountsClosed}`);
  if (catData.attendance && typeof catData.attendance === 'object') {
    const a = catData.attendance as Record<string, unknown>;
    if (a.days != null || a.late != null || a.violations != null) {
      details.push(`Attendance: ${a.days ?? 0} absences, ${a.late ?? 0} tardies, ${a.violations ?? 0} violations`);
    }
  }
  return { total, details };
}

export interface PanelItemForPdf {
  name: string;
  score: number;
}

export interface CategoryScoreForPdf {
  name: string;
  score: number;
  maxScore?: number;
  weightPct?: number;
  /** Panel names only (no scores) - shown in table with score column empty */
  panelNames?: string[];
  /** Panel name + score per row - shown in table grid */
  panelItems?: PanelItemForPdf[];
}

export interface LogDetailPdfOptions {
  title: string;
  filename: string;
  logoDataUrl?: string;
  categoryScores?: CategoryScoreForPdf[];
  finalScore?: number;
}

function loadImageAsDataUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const maxDim = 200;
        const canvas = document.createElement('canvas');
        canvas.width = maxDim;
        canvas.height = maxDim;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Preserve original aspect ratio: letterbox inside a square canvas.
        // If the SVG/png doesn't expose intrinsic dimensions, fall back to a direct draw.
        const imgW = img.naturalWidth || img.width;
        const imgH = img.naturalHeight || img.height;
        if (!imgW || !imgH) {
          ctx.drawImage(img, 0, 0, maxDim, maxDim);
          resolve(canvas.toDataURL('image/png'));
          return;
        }

        const ratio = imgW / imgH;
        let drawW: number;
        let drawH: number;
        if (ratio >= 1) {
          // Wider than tall
          drawW = maxDim;
          drawH = maxDim / ratio;
        } else {
          // Taller than wide
          drawH = maxDim;
          drawW = maxDim * ratio;
        }
        const offsetX = (maxDim - drawW) / 2;
        const offsetY = (maxDim - drawH) / 2;

        ctx.clearRect(0, 0, maxDim, maxDim);
        ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
        resolve(canvas.toDataURL('image/png'));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error(`Failed to load ${url}`));
    img.src = url;
  });
}

export function getAppLogoDataUrl(): Promise<string> {
  // Prefer `/logo.png`, but fall back to the existing `logo-from-png.svg` when the PNG is missing.
  // We convert the SVG to a PNG data URL so jsPDF can embed it via `addImage(..., 'PNG', ...)`.
  return (async () => {
    const urls = ['/logo.png', '/logo-from-png.svg', '/logo.svg'];
    let lastErr: unknown;
    for (const url of urls) {
      try {
        return await loadImageAsDataUrl(url);
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error('Failed to load app logo');
  })();
}

export function getLogDetailPdfFilename(log: Transmission, department: string): string {
  const name = (log?.userName || 'employee').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
  const date = log?.timestamp ? new Date(log.timestamp).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
  const dept = (department || '').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '') || 'Log';
  return `${name}_${date}_${dept}.pdf`;
}

function buildLogDetailPdfDocument(log: Transmission, options: LogDetailPdfOptions): jsPDF {
  const { title, logoDataUrl, categoryScores: optionsCategoryScores, finalScore: optionsFinalScore } = options;
  const displayFinalScore = optionsFinalScore ?? log.ratings?.finalScore;
  const pdf = new jsPDF('p', 'mm', 'a4');
  let y = MARGIN;
  const contentLeft = BORDER_INSET + 2;
  const contentWidth = PAGE_WIDTH - 2 * BORDER_INSET - 4;

  drawPageBorder(pdf);

  const logoRowH = 20;
  const logoMm = 14;
  const logoX = (PAGE_WIDTH - logoMm) / 2;
  const logoY = BORDER_INSET + 2 + (logoRowH - logoMm) / 2;
  if (logoDataUrl) {
    try {
      pdf.addImage(logoDataUrl, 'PNG', logoX, logoY, logoMm, logoMm);
    } catch (_) {
      drawAppLogoFallback(pdf, logoX + logoMm / 2, logoY + logoMm / 2, logoMm);
    }
  } else {
    drawAppLogoFallback(pdf, logoX + logoMm / 2, logoY + logoMm / 2, logoMm);
  }
  y = BORDER_INSET + 2 + logoRowH;

  const headerH = 24;
  pdf.setFillColor(...colors.slate[50]);
  pdf.rect(contentLeft, y, contentWidth, headerH, 'F');
  pdf.setDrawColor(...colors.slate[200]);
  pdf.setLineWidth(0.25);
  pdf.line(contentLeft, y + headerH, contentLeft + contentWidth, y + headerH);
  const tagline = 'AA2000 KPI log detail';
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  const tagW = pdf.getTextWidth(tagline);
  const xStart = PAGE_WIDTH / 2 - tagW / 2;
  pdf.setTextColor(30, 58, 138);
  pdf.text('AA', xStart, y + 9);
  pdf.setTextColor(37, 99, 235);
  pdf.text('2000', xStart + pdf.getTextWidth('AA'), y + 9);
  pdf.setTextColor(...colors.slate[700]);
  pdf.text(' KPI log detail', xStart + pdf.getTextWidth('AA2000'), y + 9);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...colors.slate[500]);
  pdf.text(String(title ?? ''), MARGIN, y + 17);
  pdf.setFontSize(8);
  pdf.text(`Generated: ${new Date().toLocaleString()}`, PAGE_WIDTH - MARGIN - 52, y + 17);
  y += headerH + 6;

  y = addSectionTitle(pdf, y, 'Employee & log');
  y = addLine(pdf, y);
  y = addKeyValue(pdf, MARGIN, y, 'Employee', log.userName || '—', true) + 2;
  y = addKeyValue(pdf, MARGIN, y, 'Log ID', log.id || '—') + 2;
  y = addKeyValue(pdf, MARGIN, y, 'Date', log.timestamp ? new Date(log.timestamp).toLocaleString() : '—') + 4;

  const status = log.status || 'pending';
  const statusLabel = status === 'validated' ? 'Transmission Validated' : status === 'rejected' ? 'Transmission Rejected' : 'Pending Verification';
  const statusSub = status === 'validated' ? 'All data points confirmed by audit node' : status === 'rejected' ? 'Data discrepancies found — Review required' : 'Awaiting supervisor audit cycle';
  if (status === 'validated') {
    y = addBlock(pdf, y, colors.emerald[50], colors.emerald[600], statusLabel, statusSub);
  } else if (status === 'rejected') {
    y = addBlock(pdf, y, colors.red[50], colors.red[600], statusLabel, statusSub);
  } else {
    y = addBlock(pdf, y, colors.blue[50], colors.blue[600], statusLabel, statusSub);
  }

  if (displayFinalScore != null && Number.isFinite(displayFinalScore)) {
    const finalNum = Number(displayFinalScore);
    const gradeInfo = getGradeForScore(finalNum);
    const quotaMet = finalNum >= 90;
    y = addSectionTitle(pdf, y, 'Final assessment grade');
    y = addLine(pdf, y);
    const scoreBlockHeight = 36;
    const scoreBlockPadding = 10;
    pdf.setFillColor(...colors.slate[100]);
    pdf.rect(MARGIN, y, CONTENT_WIDTH, scoreBlockHeight, 'F');
    pdf.setDrawColor(...colors.slate[200]);
    pdf.setLineWidth(0.25);
    pdf.rect(MARGIN, y, CONTENT_WIDTH, scoreBlockHeight, 'S');
    pdf.setDrawColor(...(quotaMet ? colors.emerald[600] : colors.blue[600]));
    pdf.setLineWidth(0.6);
    pdf.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y);
    pdf.setLineWidth(0.25);
    pdf.setDrawColor(...colors.slate[200]);
    const contentTop = y + scoreBlockPadding;
    
    // Left side: Label + Grade Letter
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.slate[700]);
    pdf.text('Official performance grade', MARGIN + 6, contentTop + 6);
    
    pdf.setFontSize(28);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...(quotaMet ? colors.emerald[600] : colors.blue[600]));
    pdf.text(gradeInfo.letter, MARGIN + 6, contentTop + 18);
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text(gradeInfo.label.toUpperCase(), MARGIN + 6, contentTop + 24);

    // Right side: Percentage Score
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.slate[900]);
    pdf.text(`${Math.round(finalNum)}%`, PAGE_WIDTH - MARGIN - 28, contentTop + 8);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...(quotaMet ? colors.emerald[600] : colors.slate[500]));
    pdf.text(quotaMet ? 'Quota met' : 'Below target', PAGE_WIDTH - MARGIN - 26, contentTop + 18);
    y += scoreBlockHeight + 6;
  }

  const usePrecomputed = optionsCategoryScores && optionsCategoryScores.length > 0;
  if (usePrecomputed) {
    y = addSectionTitle(pdf, y, 'Category breakdown');
    y = addLine(pdf, y);
    for (const cat of optionsCategoryScores) {
      const weightPct = cat.weightPct ?? 0;
      const weightedScore = Number.isFinite(weightPct) && weightPct > 0
        ? Math.round((cat.score * weightPct / 100) * 100) / 100
        : null;

      // Build panel rows first so we can estimate total required height and avoid
      // splitting the category title from its table across pages.
      const panelRows: { name: string; score: string }[] = [];
      if (cat.panelItems && cat.panelItems.length > 0) {
        for (const p of cat.panelItems) {
          panelRows.push({ name: p.name, score: String(p.score) });
        }
      } else if (cat.panelNames && cat.panelNames.length > 0) {
        for (const name of cat.panelNames) {
          panelRows.push({ name, score: '—' });
        }
      }

      // Approximate total height this category block will need:
      // - 10 high header bar + ~2 margin
      // - 6 for total/weighted score line
      // - table: header + N rows + padding
      // - 6 gap after table
      const headerBlockH = 12 + 6; // header + total line
      const tableH = panelRows.length > 0
        ? PANEL_HEADER_HEIGHT + PANEL_CELL_HEIGHT * panelRows.length + 4
        : 0;
      const gapAfter = 6;
      const neededH = headerBlockH + tableH + gapAfter;

      if (y + neededH > PAGE_HEIGHT - 18) {
        pdf.addPage();
        drawPageBorder(pdf);
        y = MARGIN;
      }

      pdf.setFillColor(...colors.slate[50]);
      pdf.rect(MARGIN, y, CONTENT_WIDTH, 10, 'F');
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...colors.slate[900]);
      pdf.text(cat.name, MARGIN + 3, y + 7);
      y += 12;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(...colors.slate[700]);
      const totalVal = cat.maxScore != null ? `${cat.score} / ${cat.maxScore}` : `${cat.score}`;
      pdf.text('Total score: ' + totalVal, MARGIN + 3, y + 5);
      if (weightedScore != null) {
        pdf.setTextColor(...colors.blue[600]);
        const weightedText = `Weighted score: ${weightedScore}%`;
        pdf.text(weightedText, PAGE_WIDTH - MARGIN - pdf.getTextWidth(weightedText) - 2, y + 5);
        pdf.setTextColor(...colors.slate[700]);
      }
      y += 6;
      if (panelRows.length > 0) {
        y = drawPanelTable(pdf, y, panelRows);
      }
      y += 6;
    }
  } else {
    const allData = log.allSalesData || {};
    const categoryNames = Object.keys(allData);
    if (categoryNames.length > 0) {
      y = addSectionTitle(pdf, y, 'Category breakdown');
      y = addLine(pdf, y);
      for (const catName of categoryNames) {
        if (y > PAGE_HEIGHT - 40) {
          pdf.addPage();
          drawPageBorder(pdf);
          y = MARGIN;
        }
        const catData = allData[catName] as Record<string, unknown>;
        const { total, details } = categoryScoreFromData(catData);
        pdf.setFillColor(...colors.slate[50]);
        pdf.rect(MARGIN, y, CONTENT_WIDTH, 10, 'F');
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...colors.slate[900]);
        pdf.text(catName, MARGIN + 3, y + 7);
        pdf.setTextColor(...colors.blue[600]);
        pdf.text(`Score: ${total}`, PAGE_WIDTH - MARGIN - 22, y + 7);
        y += 12;
        if (details.length > 0) {
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(7);
          pdf.setTextColor(...colors.slate[500]);
          const detailStr = details.slice(0, 8).join(' · ');
          const lines = pdf.splitTextToSize(detailStr, CONTENT_WIDTH - 6);
          pdf.text(lines, MARGIN + 3, y + 4);
          y += lines.length * 3.5 + 4;
        }
        y += 4;
      }
    }
  }

  if (y > PAGE_HEIGHT - 45) {
    pdf.addPage();
    drawPageBorder(pdf);
    y = MARGIN;
  }
  y = addSectionTitle(pdf, y, 'Employee narrative');
  y = addLine(pdf, y);
  const narrative = String(log.projectReport || 'No narrative provided.');
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...colors.slate[700]);
  const narrativeLines = pdf.splitTextToSize(narrative, CONTENT_WIDTH);
  pdf.text(narrativeLines, MARGIN, y + 4);
  y += narrativeLines.length * 4 + 10;

  if (y > PAGE_HEIGHT - 35) {
    pdf.addPage();
    drawPageBorder(pdf);
    y = MARGIN;
  }
  y = addSectionTitle(pdf, y, 'Evidence registry');
  y = addLine(pdf, y);
  if (log.attachments && log.attachments.length > 0) {
    log.attachments.forEach((f) => {
      pdf.setFontSize(8);
      pdf.setTextColor(...colors.slate[700]);
      pdf.text(`• ${f.name} (${f.size || '—'})`, MARGIN + 2, y + 4);
      y += 6;
    });
  } else {
    pdf.setFontSize(8);
    pdf.setTextColor(...colors.slate[500]);
    pdf.text('No attached files', MARGIN + 2, y + 4);
    y += 8;
  }
  y += 6;

  if (y > PAGE_HEIGHT - 40) {
    pdf.addPage();
    drawPageBorder(pdf);
    y = MARGIN;
  }
  y = addSectionTitle(pdf, y, 'Supervisor directive / feedback');
  y = addLine(pdf, y);
  const feedback = String(log.supervisorComment || 'No supervisor justification recorded.');
  pdf.setFillColor(...colors.amber[50]);
  pdf.rect(MARGIN, y, CONTENT_WIDTH, 20, 'F');
  pdf.setDrawColor(...colors.amber[100]);
  pdf.rect(MARGIN, y, CONTENT_WIDTH, 20, 'S');
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...colors.amber[700]);
  const feedbackLines = pdf.splitTextToSize(feedback, CONTENT_WIDTH - 8);
  pdf.text(feedbackLines, MARGIN + 4, y + 8);
  y += 26;

  const totalPages = pdf.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    drawFooterOnPage(pdf);
  }
  return pdf;
}

export function createLogDetailPdfBlob(log: Transmission, options: LogDetailPdfOptions): Blob {
  if (!log || !options) {
    throw new Error('Cannot generate PDF: missing log or options');
  }
  const pdf = buildLogDetailPdfDocument(log, options);
  return pdf.output('blob') as Blob;
}

export function downloadLogDetailPdf(log: Transmission, options: LogDetailPdfOptions): void {
  if (!log || !options) {
    throw new Error('Cannot generate PDF: missing log or options');
  }
  const name = options.filename || 'log-detail-receipt.pdf';
  try {
    const blob = createLogDetailPdfBlob(log, options);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.rel = 'noopener';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 300);
  } catch {
    // Fallback: regenerate document and use jsPDF save
    const pdf = buildLogDetailPdfDocument(log, options);
    pdf.save(name);
  }
}
