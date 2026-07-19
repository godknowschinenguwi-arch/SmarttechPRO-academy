// SmartTech Academy — certificate PDF generator (A4 landscape, brand styled, QR verified).
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib';
import QRCode from 'qrcode';

const BLUE = rgb(0.08, 0.22, 0.56);       // deep brand blue
const BLUE_BRIGHT = rgb(0.11, 0.37, 0.96);
const ORANGE = rgb(0.98, 0.45, 0.09);
const INK = rgb(0.04, 0.08, 0.15);
const FAINT = rgb(0.41, 0.47, 0.56);
const PAPER = rgb(1, 1, 1);
const SOFT = rgb(0.96, 0.97, 0.99);

export type CertData = {
  serial: string;
  studentName: string;
  courseTitle: string;
  instructorName: string;
  hoursCompleted: number;
  issuedAt: string; // ISO
  kind: string; // COURSE | PRACTICAL
  appUrl: string;
};

function centered(page: PDFPage, text: string, y: number, font: PDFFont, size: number, color = INK) {
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: (page.getWidth() - w) / 2, y, size, font, color });
}

export async function generateCertificatePdf(cert: CertData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([841.89, 595.28]); // A4 landscape (pt)
  const W = page.getWidth();
  const H = page.getHeight();

  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const helvBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const times = await pdf.embedFont(StandardFonts.TimesRoman);
  const timesItalic = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const timesBold = await pdf.embedFont(StandardFonts.TimesRomanBold);

  // Background + frame
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: PAPER });
  page.drawRectangle({ x: 18, y: 18, width: W - 36, height: H - 36, borderColor: BLUE, borderWidth: 3 });
  page.drawRectangle({ x: 26, y: 26, width: W - 52, height: H - 52, borderColor: ORANGE, borderWidth: 1 });

  // Corner accents
  const corner = 46;
  for (const [cx, cy, dx, dy] of [
    [26, H - 26, 1, -1], [W - 26, H - 26, -1, -1], [26, 26, 1, 1], [W - 26, 26, -1, 1],
  ] as const) {
    page.drawLine({ start: { x: cx, y: cy - dy * 0 }, end: { x: cx + dx * corner, y: cy }, thickness: 3, color: ORANGE });
    page.drawLine({ start: { x: cx, y: cy }, end: { x: cx, y: cy + dy * corner }, thickness: 3, color: ORANGE });
  }

  // Header band
  page.drawRectangle({ x: 60, y: H - 118, width: W - 120, height: 54, color: SOFT });
  centered(page, 'SMARTTECH  ACADEMY', H - 92, helvBold, 24, BLUE);
  centered(page, 'Building Africa’s Next Generation of Skilled Technicians', H - 110, helv, 10, FAINT);

  // Title
  centered(page, cert.kind === 'PRACTICAL' ? 'CERTIFICATE OF PRACTICAL COMPETENCE' : 'CERTIFICATE OF COMPLETION', H - 165, helvBold, 17, ORANGE);
  const titleW = helvBold.widthOfTextAtSize('CERTIFICATE OF COMPLETION', 17);
  page.drawLine({ start: { x: (W - titleW) / 2, y: H - 173 }, end: { x: (W + titleW) / 2, y: H - 173 }, thickness: 1, color: ORANGE });

  // Body
  centered(page, 'This is to certify that', H - 210, timesItalic, 14, FAINT);

  // Student name — auto-size to fit
  let nameSize = 40;
  while (timesBold.widthOfTextAtSize(cert.studentName, nameSize) > W - 240 && nameSize > 22) nameSize -= 2;
  centered(page, cert.studentName, H - 258, timesBold, nameSize, INK);
  const nameW = timesBold.widthOfTextAtSize(cert.studentName, nameSize);
  page.drawLine({ start: { x: (W - nameW) / 2 - 20, y: H - 270 }, end: { x: (W + nameW) / 2 + 20, y: H - 270 }, thickness: 0.8, color: BLUE_BRIGHT });

  centered(page, 'has successfully completed the programme', H - 298, timesItalic, 14, FAINT);

  let courseSize = 22;
  while (helvBold.widthOfTextAtSize(cert.courseTitle, courseSize) > W - 200 && courseSize > 14) courseSize -= 1;
  centered(page, cert.courseTitle, H - 330, helvBold, courseSize, BLUE);

  const issued = new Date(cert.issuedAt);
  const dateStr = issued.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  centered(page, `${cert.hoursCompleted} hours of instruction  ·  Completed on ${dateStr}`, H - 356, helv, 11, FAINT);

  // Signature blocks
  const sigY = 128;
  const sigLine = (x: number, label: string, name: string) => {
    page.drawLine({ start: { x, y: sigY }, end: { x: x + 175, y: sigY }, thickness: 0.8, color: INK });
    page.drawText(name, { x, y: sigY + 8, size: 12, font: timesItalic, color: INK });
    page.drawText(label, { x, y: sigY - 14, size: 8.5, font: helv, color: FAINT });
  };
  sigLine(100, 'COURSE INSTRUCTOR', cert.instructorName);
  sigLine(W - 345, 'DIRECTOR, SMARTTECH ACADEMY', '');

  // Seal (drawn rosette)
  const sealX = W / 2;
  const sealY = sigY + 10;
  page.drawCircle({ x: sealX, y: sealY, size: 34, borderColor: ORANGE, borderWidth: 2.5 });
  page.drawCircle({ x: sealX, y: sealY, size: 27, borderColor: BLUE, borderWidth: 1.2 });
  centered(page, 'VERIFIED', sealY + 4, helvBold, 8, BLUE);
  centered(page, 'AUTHENTIC', sealY - 7, helvBold, 6.5, ORANGE);

  // QR code → verification URL
  const verifyUrl = `${cert.appUrl}/verify/${cert.serial}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 240, color: { dark: '#0b1526', light: '#ffffff' } });
  const qrImage = await pdf.embedPng(Buffer.from(qrDataUrl.split(',')[1], 'base64'));
  page.drawImage(qrImage, { x: W - 148, y: 44, width: 84, height: 84 });
  page.drawText('Scan to verify', { x: W - 143, y: 34, size: 7.5, font: helv, color: FAINT });

  // Serial + footer
  page.drawText(`Certificate No: ${cert.serial}`, { x: 64, y: 58, size: 10, font: helvBold, color: INK });
  page.drawText(`Verify online: ${verifyUrl}`, { x: 64, y: 44, size: 8.5, font: helv, color: FAINT });
  page.drawText(`Issued: ${dateStr}`, { x: 64, y: 32, size: 8.5, font: helv, color: FAINT });

  pdf.setTitle(`SmartTech Academy Certificate — ${cert.studentName}`);
  pdf.setAuthor('SmartTech Academy');
  pdf.setSubject(cert.courseTitle);

  return pdf.save();
}
