// Generates a downloadable "offline pack" PDF for a course - the lesson
// theory/notes text and curriculum outline, for reading without a data
// connection. Video lessons have no local file to bundle (streamed from an
// external provider), so those are listed by title only.
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib';
import { sanitizeForPdf } from './pdfText';

const BLUE = rgb(0.08, 0.22, 0.56);
const ORANGE = rgb(0.98, 0.45, 0.09);
const INK = rgb(0.04, 0.08, 0.15);
const FAINT = rgb(0.41, 0.47, 0.56);
const PAPER = rgb(1, 1, 1);

const W = 595.28;
const H = 841.89;
const MARGIN = 56;

function htmlToParagraphs(html: string): string[] {
  return html
    .replace(/<(li|p|br|h[1-6])[^>]*>/gi, '\n')
    .replace(/<\/(li|p|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .split('\n')
    .map((s) => sanitizeForPdf(s.trim()))
    .filter(Boolean);
}

class Cursor {
  page: PDFPage;
  y: number;

  constructor(private pdf: PDFDocument) {
    this.page = pdf.addPage([W, H]);
    this.y = H - MARGIN;
  }

  private ensureSpace(needed: number) {
    if (this.y - needed < MARGIN) {
      this.page = this.pdf.addPage([W, H]);
      this.y = H - MARGIN;
    }
  }

  line(str: string, font: PDFFont, size: number, color = INK, gapAfter = 6) {
    this.ensureSpace(size + gapAfter);
    this.page.drawText(sanitizeForPdf(str), { x: MARGIN, y: this.y, size, font, color });
    this.y -= size + gapAfter;
  }

  wrapped(str: string, font: PDFFont, size: number, color = INK, gapAfter = 6) {
    const safe = sanitizeForPdf(str);
    const words = safe.split(/\s+/);
    let current = '';
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) > W - MARGIN * 2) {
        this.line(current, font, size, color, 2);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) this.line(current, font, size, color, gapAfter);
  }

  gap(n: number) {
    this.y -= n;
  }

  rule() {
    this.ensureSpace(10);
    this.page.drawLine({ start: { x: MARGIN, y: this.y }, end: { x: W - MARGIN, y: this.y }, thickness: 1, color: rgb(0.89, 0.92, 0.95) });
    this.y -= 14;
  }
}

export interface OfflinePackData {
  course: { title: string; subtitle: string | null; description: string; durationHours: number };
  modules: { id: string; title: string; order: number }[];
  lessons: { id: string; moduleId: string; title: string; order: number; kind: string; estMinutes: number; contentHtml: string | null }[];
}

export async function generateCourseOfflinePdf({ course, modules, lessons }: OfflinePackData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const helvBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // ---------- Cover ----------
  const cover = pdf.addPage([W, H]);
  cover.drawRectangle({ x: 0, y: 0, width: W, height: H, color: PAPER });
  cover.drawRectangle({ x: 0, y: H - 160, width: W, height: 160, color: BLUE });
  cover.drawRectangle({ x: 0, y: H - 164, width: W, height: 4, color: ORANGE });
  cover.drawText('SMARTTECH ACADEMY', { x: MARGIN, y: H - 60, size: 14, font: helvBold, color: PAPER });
  cover.drawText('Offline Course Pack', { x: MARGIN, y: H - 84, size: 12, font: helv, color: rgb(0.85, 0.9, 1) });
  cover.drawText(sanitizeForPdf(course.title), { x: MARGIN, y: H - 220, size: 22, font: helvBold, color: INK, maxWidth: W - MARGIN * 2 });
  if (course.subtitle) {
    cover.drawText(sanitizeForPdf(course.subtitle), { x: MARGIN, y: H - 250, size: 11, font: helv, color: FAINT, maxWidth: W - MARGIN * 2 });
  }
  cover.drawText(`${modules.length} modules - ${lessons.length} lessons - ${course.durationHours} hours`, {
    x: MARGIN, y: H - 280, size: 10, font: helv, color: FAINT,
  });
  cover.drawText('Lesson notes and theory content for reading without a data connection.', {
    x: MARGIN, y: 80, size: 9, font: helv, color: FAINT,
  });
  cover.drawText('Video lessons are listed by title only - they require a connection to stream.', {
    x: MARGIN, y: 66, size: 9, font: helv, color: FAINT,
  });
  cover.drawText('SmartTech Academy - smarttech.academy', { x: MARGIN, y: 40, size: 9, font: helvBold, color: INK });

  // ---------- Lesson content ----------
  const cursor = new Cursor(pdf);
  const lessonsByModule = new Map<string, typeof lessons>();
  for (const l of lessons) {
    if (!lessonsByModule.has(l.moduleId)) lessonsByModule.set(l.moduleId, []);
    lessonsByModule.get(l.moduleId)!.push(l);
  }

  for (const mod of modules) {
    cursor.gap(6);
    cursor.line(mod.title.toUpperCase(), helvBold, 14, BLUE, 10);
    cursor.rule();

    for (const lesson of lessonsByModule.get(mod.id) ?? []) {
      cursor.line(`${lesson.title}`, helvBold, 12, INK, 2);
      cursor.line(`${lesson.kind.replace('_', ' ')} - ${lesson.estMinutes} min`, helv, 8.5, FAINT, 8);

      if (lesson.contentHtml) {
        for (const para of htmlToParagraphs(lesson.contentHtml)) {
          cursor.wrapped(para, helv, 10, INK, 4);
          cursor.gap(4);
        }
      } else {
        cursor.wrapped('Video/practical lesson - notes not available offline. Stream this lesson online when connected.', helv, 9.5, FAINT, 4);
      }
      cursor.gap(10);
    }
  }

  pdf.setTitle(`${course.title} - Offline Course Pack`);
  pdf.setAuthor('SmartTech Academy');
  pdf.setSubject('Offline course pack');

  return pdf.save();
}
