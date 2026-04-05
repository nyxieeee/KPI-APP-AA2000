import { jsPDF } from 'jspdf';

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
        const imgW = img.naturalWidth || img.width;
        const imgH = img.naturalHeight || img.height;

        // Some SVGs may not expose intrinsic dimensions reliably; draw a direct fit fallback.
        if (!imgW || !imgH) {
          ctx.drawImage(img, 0, 0, maxDim, maxDim);
          resolve(canvas.toDataURL('image/png'));
          return;
        }

        const ratio = imgW / imgH;
        let drawW: number;
        let drawH: number;
        if (ratio >= 1) {
          drawW = maxDim;
          drawH = maxDim / ratio;
        } else {
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

export async function getAppLogoDataUrl(): Promise<string> {
  // Prefer `/logo.png`, but fall back to the existing repo assets.
  // Converting SVG => PNG data URL keeps jsPDF embedding consistent.
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
}

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

