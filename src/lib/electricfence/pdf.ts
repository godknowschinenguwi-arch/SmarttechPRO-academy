// SmartTech Electric Fence — branded proposal PDF generator (A4 portrait),
// styled to match the solar proposal generator's brand system.
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib';
import QRCode from 'qrcode';
import { sanitizeForPdf } from '../pdfText';
import type { FenceDesignResult, FenceConfig } from './types';

const BLUE = rgb(0.08, 0.22, 0.56);
const ORANGE = rgb(0.98, 0.45, 0.09);
const INK = rgb(0.04, 0.08, 0.15);
const FAINT = rgb(0.41, 0.47, 0.56);
const PAPER = rgb(1, 1, 1);
const SOFT = rgb(0.96, 0.97, 0.99);

function text(page: PDFPage, str: string, x: number, y: number, font: PDFFont, size: number, color = INK) {
  page.drawText(str, { x, y, size, font, color });
}

function money(usd: number): string {
  return `$${usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export interface FenceProposalData {
  design: FenceDesignResult;
  config: FenceConfig;
  appUrl: string;
}

export async function generateFenceProposalPdf({ design, config, appUrl }: FenceProposalData): Promise<Uint8Array> {
  config = { ...config, clientName: sanitizeForPdf(config.clientName), siteName: sanitizeForPdf(config.siteName), notes: sanitizeForPdf(config.notes) };
  const pdf = await PDFDocument.create();
  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const helvBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const W = 595.28;
  const H = 841.89;
  const margin = 48;

  const p1 = pdf.addPage([W, H]);
  p1.drawRectangle({ x: 0, y: 0, width: W, height: H, color: PAPER });
  p1.drawRectangle({ x: 0, y: H - 150, width: W, height: 150, color: BLUE });
  p1.drawRectangle({ x: 0, y: H - 154, width: W, height: 4, color: ORANGE });

  text(p1, 'SMARTTECH ELECTRIC FENCE', margin, H - 60, helvBold, 20, PAPER);
  text(p1, 'System Design Proposal', margin, H - 84, helv, 12, rgb(0.85, 0.9, 1));
  text(p1, `Generated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, margin, H - 130, helv, 9, rgb(0.8, 0.86, 0.98));

  let y = H - 190;
  text(p1, 'Prepared for', margin, y, helvBold, 9, FAINT);
  text(p1, config.clientName || 'Prospective client', margin, y - 18, helvBold, 16, INK);
  text(p1, config.siteName || 'Site address not specified', margin, y - 34, helv, 10, FAINT);

  y -= 70;
  const cardW = (W - margin * 2 - 24) / 4;
  const cards: [string, string][] = [
    ['Perimeter', `${(design.totalPerimeterM / 1000).toFixed(2)} km`],
    ['Energizer', `${design.energizerCount} × ${design.energizer.joulesOutput}J`],
    ['Posts', String(design.postCount)],
    ['Total cost', money(design.totalUsd)],
  ];
  cards.forEach(([label, value], i) => {
    const x = margin + i * (cardW + 8);
    p1.drawRectangle({ x, y: y - 60, width: cardW, height: 60, borderColor: rgb(0.89, 0.92, 0.95), borderWidth: 1, color: PAPER });
    text(p1, value, x + 10, y - 28, helvBold, 14, BLUE);
    text(p1, label.toUpperCase(), x + 10, y - 46, helv, 7.5, FAINT);
  });

  // ---------- Bill of materials ----------
  y -= 100;
  text(p1, 'Bill of Materials', margin, y, helvBold, 13, INK);
  y -= 24;
  text(p1, 'ITEM', margin, y, helvBold, 9, FAINT);
  text(p1, 'DETAIL', margin + 160, y, helvBold, 9, FAINT);
  text(p1, 'QTY', margin + 340, y, helvBold, 9, FAINT);
  text(p1, 'UNIT', margin + 385, y, helvBold, 9, FAINT);
  text(p1, 'TOTAL', W - margin - 60, y, helvBold, 9, FAINT);
  y -= 8;
  p1.drawLine({ start: { x: margin, y }, end: { x: W - margin, y }, thickness: 1, color: rgb(0.89, 0.92, 0.95) });
  y -= 18;

  for (const line of design.bom) {
    text(p1, line.label.slice(0, 30), margin, y, helvBold, 9, INK);
    text(p1, line.detail.slice(0, 40), margin + 160, y, helv, 8, FAINT);
    text(p1, String(line.qty), margin + 340, y, helv, 8.5, INK);
    text(p1, money(line.unitPriceUsd), margin + 385, y, helv, 8.5, INK);
    const totalStr = money(line.totalUsd);
    text(p1, totalStr, W - margin - helvBold.widthOfTextAtSize(totalStr, 9), y, helvBold, 9, INK);
    y -= 18;
  }

  y -= 4;
  p1.drawLine({ start: { x: margin, y }, end: { x: W - margin, y }, thickness: 1, color: rgb(0.89, 0.92, 0.95) });
  y -= 20;

  const totalsRow = (label: string, value: string, bold = false, big = false) => {
    const font = bold ? helvBold : helv;
    const size = big ? 13 : 9.5;
    text(p1, label, margin + 240, y, font, size, bold ? INK : FAINT);
    const w = font.widthOfTextAtSize(value, size);
    text(p1, value, W - margin - w, y, font, size, bold ? BLUE : INK);
    y -= big ? 24 : 16;
  };
  totalsRow('Equipment subtotal', money(design.equipmentTotalUsd));
  totalsRow('Install & contingency buffer', money(design.installBufferUsd));
  y -= 10;
  p1.drawRectangle({ x: margin, y: y - 8, width: W - margin * 2, height: 30, color: SOFT });
  totalsRow('TOTAL SYSTEM COST', money(design.totalUsd), true, true);

  y -= 20;
  text(p1, 'Engineering summary', margin, y, helvBold, 11, INK);
  y -= 16;
  const engRows: [string, string][] = [
    ['Effective fence range', `${design.effectiveFenceKm.toFixed(1)} km`],
    ['Wire spools required', `${design.wireSpoolsNeeded} × ${design.wire.spoolLengthM}m`],
    ['Earth stakes', String(design.earthStakeCount)],
    ['Backup battery', design.battery ? `${design.batteryCount} × ${design.battery.model}` : 'None (mains only)'],
  ];
  engRows.forEach(([k, v]) => {
    text(p1, k, margin, y, helv, 9, FAINT);
    text(p1, v, margin + 220, y, helvBold, 9, INK);
    y -= 15;
  });

  if (config.notes) {
    y -= 10;
    text(p1, 'Notes', margin, y, helvBold, 10, INK);
    y -= 14;
    const words = config.notes.split(/\s+/);
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (helv.widthOfTextAtSize(test, 9) > W - margin * 2) {
        text(p1, line, margin, y, helv, 9, FAINT);
        y -= 13;
        line = word;
      } else {
        line = test;
      }
    }
    if (line) text(p1, line, margin, y, helv, 9, FAINT);
  }

  const verifyUrl = `${appUrl}/electric-fence-calculator`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 200, color: { dark: '#0b1526', light: '#ffffff' } });
  const qrImage = await pdf.embedPng(Buffer.from(qrDataUrl.split(',')[1], 'base64'));
  p1.drawImage(qrImage, { x: W - margin - 60, y: 44, width: 60, height: 60 });
  text(p1, 'Redesign / recalculate', W - margin - 60, 36, helv, 6.5, FAINT);

  text(p1, 'Indicative sizing only — final design must be verified by a qualified installer against a site survey,', margin, 68, helv, 7.5, FAINT);
  text(p1, 'soil/vegetation conditions, and local electrical safety and security-fencing regulations.', margin, 57, helv, 7.5, FAINT);
  text(p1, 'SmartTech Academy — smarttech.academy', margin, 40, helvBold, 8.5, INK);

  pdf.setTitle(`SmartTech Electric Fence Proposal — ${config.clientName || 'Design'}`);
  pdf.setAuthor('SmartTech Academy');
  pdf.setSubject('Electric fence system design proposal');

  return pdf.save();
}
