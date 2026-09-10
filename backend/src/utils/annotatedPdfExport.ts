import { PDFDocument, rgb, StandardFonts, PDFName, PDFArray, PDFString } from 'pdf-lib';
import { PdfDocument, Citation, PdfAnnotation } from '../types.js';

export interface GenerateAnnotatedPdfOptions {
  includeCitationsAsHighlights?: boolean;
  userAnnotations?: PdfAnnotation[];
  citations?: Citation[];
}

/**
 * Builds an Adobe Acrobat / Apple Preview compliant annotated PDF with native
 * Highlight and Text/Popup annotation dictionaries embedded in the PDF page structure.
 */
export async function generateAnnotatedPdf(
  doc: PdfDocument,
  options: GenerateAnnotatedPdfOptions = {}
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Group citations and annotations by page
  const citationsByPage = new Map<number, Citation[]>();
  if (options.includeCitationsAsHighlights !== false && options.citations) {
    for (const cite of options.citations) {
      const list = citationsByPage.get(cite.pageNumber) || [];
      list.push(cite);
      citationsByPage.set(cite.pageNumber, list);
    }
  }

  const annotationsByPage = new Map<number, PdfAnnotation[]>();
  if (options.userAnnotations) {
    for (const annot of options.userAnnotations) {
      const list = annotationsByPage.get(annot.pageNumber) || [];
      list.push(annot);
      annotationsByPage.set(annot.pageNumber, list);
    }
  }

  for (const pageData of doc.pages) {
    // Standard Letter page size: 612 x 792 pt
    const page = pdfDoc.addPage([612, 792]);
    const { width, height } = page.getSize();

    // Draw page header
    page.drawText(doc.name, {
      x: 50,
      y: height - 40,
      size: 10,
      font: boldFont,
      color: rgb(0.3, 0.35, 0.45),
    });

    page.drawText(`Page ${pageData.pageNumber} of ${doc.pageCount}`, {
      x: width - 120,
      y: height - 40,
      size: 10,
      font,
      color: rgb(0.4, 0.45, 0.55),
    });

    // Separator line
    page.drawLine({
      start: { x: 50, y: height - 48 },
      end: { x: width - 50, y: height - 48 },
      thickness: 1,
      color: rgb(0.85, 0.88, 0.92),
    });

    let currentY = height - 75;

    // Section title
    if (pageData.title) {
      page.drawText(pageData.title, {
        x: 50,
        y: currentY,
        size: 14,
        font: boldFont,
        color: rgb(0.1, 0.15, 0.25),
      });
      currentY -= 25;
    }

    // Wrap and draw body content text
    const textLines = wrapText(pageData.content, 85);
    for (const line of textLines) {
      if (currentY < 60) break; // Don't overflow bottom margin
      page.drawText(line, {
        x: 50,
        y: currentY,
        size: 9.5,
        font,
        color: rgb(0.15, 0.18, 0.22),
        lineHeight: 14,
      });
      currentY -= 14;
    }

    // Attach native PDF Highlight and Text annotations to this page's /Annots dictionary
    const context = pdfDoc.context;
    let annots = page.node.lookup(PDFName.of('Annots')) as PDFArray | undefined;
    if (!annots) {
      annots = context.obj([]);
      page.node.set(PDFName.of('Annots'), annots);
    }

    // 1. Add citations as native Highlight & Sticky Notes
    const pageCitations = citationsByPage.get(pageData.pageNumber) || [];
    let citeYOffset = height - 120;
    for (const cite of pageCitations) {
      // Highlight annotation
      const annotDict = context.obj({
        Type: PDFName.of('Annot'),
        Subtype: PDFName.of('Highlight'),
        Rect: [50, citeYOffset - 5, width - 50, citeYOffset + 15],
        QuadPoints: [
          50, citeYOffset + 15,
          width - 50, citeYOffset + 15,
          50, citeYOffset - 5,
          width - 50, citeYOffset - 5,
        ],
        C: [1, 0.88, 0.25], // Golden-yellow highlight
        Contents: PDFString.of(`[AskMyPDF AI Citation] ${cite.heading || ''}: "${cite.snippet}"`),
        F: 4, // Print flag
      });
      const annotRef = context.register(annotDict);
      annots.push(annotRef);

      // Sticky Note / Comment annotation
      const textAnnotDict = context.obj({
        Type: PDFName.of('Annot'),
        Subtype: PDFName.of('Text'),
        Rect: [width - 45, citeYOffset, width - 25, citeYOffset + 20],
        Contents: PDFString.of(`AI Reference Citation:\n${cite.snippet}`),
        Name: PDFName.of('Comment'),
        C: [0.3, 0.4, 0.9],
        F: 4,
      });
      const textAnnotRef = context.register(textAnnotDict);
      annots.push(textAnnotRef);

      citeYOffset -= 40;
    }

    // 2. Add user custom annotations
    const userAnnots = annotationsByPage.get(pageData.pageNumber) || [];
    for (const uAnnot of userAnnots) {
      // Convert percentage coordinates to PDF points (origin is bottom-left)
      const pdfX1 = 50 + (uAnnot.rect.x / 100) * (width - 100);
      const pdfX2 = pdfX1 + (uAnnot.rect.width / 100) * (width - 100);
      const pdfY2 = height - (uAnnot.rect.y / 100) * height;
      const pdfY1 = pdfY2 - (uAnnot.rect.height / 100) * height;

      const userAnnotDict = context.obj({
        Type: PDFName.of('Annot'),
        Subtype: PDFName.of('Highlight'),
        Rect: [pdfX1, Math.min(pdfY1, pdfY2), pdfX2, Math.max(pdfY1, pdfY2)],
        QuadPoints: [
          pdfX1, Math.max(pdfY1, pdfY2),
          pdfX2, Math.max(pdfY1, pdfY2),
          pdfX1, Math.min(pdfY1, pdfY2),
          pdfX2, Math.min(pdfY1, pdfY2),
        ],
        C: [0.4, 0.8, 1.0], // Azure highlight
        Contents: PDFString.of(uAnnot.note || uAnnot.text || 'User Note'),
        F: 4,
      });
      const userRef = context.register(userAnnotDict);
      annots.push(userRef);
    }

    // Page footer
    page.drawText('Exported via AskMyPDF Research Platform with Native AI Annotations', {
      x: 50,
      y: 25,
      size: 8,
      font,
      color: rgb(0.6, 0.65, 0.75),
    });
  }

  return await pdfDoc.save({ useObjectStreams: false });
}

/**
 * Triggers a client-side download of the annotated PDF in the browser.
 */
export async function downloadAnnotatedPdf(
  doc: PdfDocument,
  options: GenerateAnnotatedPdfOptions = {}
): Promise<void> {
  const pdfBytes = await generateAnnotatedPdf(doc, options);
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${doc.name.replace(/\.[^/.]+$/, '')}-Annotated.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Helper to wrap text into lines at word boundaries.
 */
function wrapText(text: string, maxCharsPerLine: number): string[] {
  const lines: string[] = [];
  const paragraphs = text.split('\n');

  for (const para of paragraphs) {
    if (!para.trim()) {
      lines.push('');
      continue;
    }
    const words = para.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + ' ' + word).trim().length > maxCharsPerLine) {
        if (currentLine) lines.push(currentLine.trim());
        currentLine = word;
      } else {
        currentLine = currentLine ? currentLine + ' ' + word : word;
      }
    }
    if (currentLine) lines.push(currentLine.trim());
  }

  return lines;
}
