import * as htmlToImage from 'html-to-image';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

export interface CaptureOptions {
  width?: number;
  height?: number;
  scale?: number;
}

/**
 * Capture an HTML DOM element to high-resolution PNG Data URL
 * Uses a 3-tier robust cascade:
 * 1. html-to-image (SVG foreignObject native browser rendering with Tailwind v4 & modern CSS support)
 * 2. html-to-image with skipFonts: true (avoids CORS issues with Google Fonts)
 * 3. html2canvas-pro fallback
 */
export async function captureElementToDataUrl(
  element: HTMLElement,
  options: CaptureOptions = {}
): Promise<string> {
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // fonts ready check fallback
    }
  }

  // Small delay for DOM layout settling
  await new Promise((resolve) => setTimeout(resolve, 80));

  const width = options.width || element.offsetWidth || 794;
  const height = options.height || element.offsetHeight || 1123;
  const pixelRatio = options.scale || 2;

  // Tier 1: html-to-image with skipFonts: true (avoids cross-origin stylesheet reading errors with remote fonts)
  try {
    const dataUrl = await htmlToImage.toPng(element, {
      pixelRatio,
      backgroundColor: '#ffffff',
      width,
      height,
      skipFonts: true,
      fontEmbedCSS: '',
      cacheBust: false,
    });
    if (dataUrl && dataUrl.length > 1000) {
      return dataUrl;
    }
  } catch (err1) {
    console.warn('html-to-image capture failed, trying html2canvas-pro fallback:', err1);
  }

  // Tier 2: html2canvas-pro fallback
  try {
    const canvas = await html2canvas(element, {
      scale: pixelRatio,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      width,
      height,
      windowWidth: width,
      windowHeight: height,
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
    });
    return canvas.toDataURL('image/png', 0.95);
  } catch (err2) {
    console.error('All PDF image capture methods failed:', err2);
    throw new Error('ไม่สามารถประมวลผลรูปภาพเอกสารสำหรับ PDF ได้ กรุณาลองใหม่อีกครั้ง');
  }
}

/**
 * Generate and save an A4 PDF document from a single captured DOM element
 */
export async function exportElementToA4Pdf(
  element: HTMLElement,
  fileName: string,
  orientation: 'portrait' | 'landscape' = 'portrait',
  options: CaptureOptions = {}
): Promise<void> {
  const targetWidth = orientation === 'portrait' ? 794 : 1123;
  const targetHeight = orientation === 'portrait' ? 1123 : 794;

  const dataUrl = await captureElementToDataUrl(element, {
    width: options.width || targetWidth,
    height: options.height || targetHeight,
    scale: options.scale || 2,
  });

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidthMm = orientation === 'portrait' ? 210 : 297;
  const pageHeightMm = orientation === 'portrait' ? 297 : 210;

  pdf.addImage(dataUrl, 'PNG', 0, 0, pageWidthMm, pageHeightMm, undefined, 'FAST');
  pdf.save(fileName);
}

/**
 * Generate and save a multi-page A4 PDF document from an array of DOM elements
 */
export async function exportElementsToMultiPageA4Pdf(
  elements: HTMLElement[],
  fileName: string,
  onProgress?: (current: number, total: number) => void,
  orientation: 'portrait' | 'landscape' = 'portrait',
  options: CaptureOptions = {}
): Promise<void> {
  if (elements.length === 0) {
    throw new Error('ไม่พบข้อมูลหน้าเอกสารสำหรับออก PDF');
  }

  const targetWidth = orientation === 'portrait' ? 794 : 1123;
  const targetHeight = orientation === 'portrait' ? 1123 : 794;
  const pageWidthMm = orientation === 'portrait' ? 210 : 297;
  const pageHeightMm = orientation === 'portrait' ? 297 : 210;

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  for (let i = 0; i < elements.length; i++) {
    if (onProgress) {
      onProgress(i + 1, elements.length);
    }

    const el = elements[i];
    const dataUrl = await captureElementToDataUrl(el, {
      width: options.width || targetWidth,
      height: options.height || targetHeight,
      scale: options.scale || 2,
    });

    if (i > 0) {
      pdf.addPage('a4', orientation);
    }

    pdf.addImage(dataUrl, 'PNG', 0, 0, pageWidthMm, pageHeightMm, undefined, 'FAST');
  }

  pdf.save(fileName);
}
