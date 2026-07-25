// SmartTech Solar — branded proposal PDF generator (A4 portrait), styled to match
// the certificate generator's brand system (blue / orange / ink).
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib';
import QRCode from 'qrcode';
import type { DesignResult, SiteConfig } from './types';

const BLUE = rgb(0.08, 0.22, 0.56);
const BLUE_BRIGHT = rgb(0.11, 0.37, 0.96);
const ORANGE = rgb(0.98, 0.45, 0.09);
const INK = rgb(0.04, 0.08, 0.15);
const FAINT = rgb(0.41, 0.47, 0.56);
const PAPER = rgb(1, 1, 1);
const SOFT = rgb(0.96, 0.97, 0.99);

const SYSTEM_LABEL: Record<string, string> = { OFF_GRID: 'Off-Grid', HYBRID: 'Hybrid', GRID_TIED: 'Grid-Tied' };

function text(page: PDFPage, str: string, x: number, y: number, font: PDFFont, size: number, color = INK) {
  page.drawText(str, { x, y, size, font, color });
}

function money(usd: number): string {
  return `$${usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export interface ProposalData {
  design: DesignResult;
  site: SiteConfig;
  appUrl: string;
}

export async function generateSolarProposalPdf({ design, site, appUrl }: ProposalData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const helvBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const W = 595.28;
  const H = 841.89;
  const margin = 48;

  // ---------- Page 1: Cover + summary ----------
  const p1 = pdf.addPage([W, H]);
  p1.drawRectangle({ x: 0, y: 0, width: W, height: H, color: PAPER });
  p1.drawRectangle({ x: 0, y: H - 150, width: W, height: 150, color: BLUE });
  p1.drawRectangle({ x: 0, y: H - 154, width: W, height: 4, color: ORANGE });

  text(p1, 'SMARTTECH SOLAR', margin, H - 60, helvBold, 22, PAPER);
  text(p1, 'System Design Proposal', margin, H - 84, helv, 12, rgb(0.85, 0.9, 1));
  text(p1, `Generated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, margin, H - 130, helv, 9, rgb(0.8, 0.86, 0.98));

  let y = H - 190;
  text(p1, 'Prepared for', margin, y, helvBold, 9, FAINT);
  text(p1, site.clientName || 'Prospective client', margin, y - 18, helvBold, 16, INK);
  text(p1, site.siteName || 'Site address not specified', margin, y - 34, helv, 10, FAINT);

  y -= 70;
  p1.drawRectangle({ x: margin, y: y - 30, width: W - margin * 2, height: 30, color: SOFT });
  text(p1, `SYSTEM TYPE: ${SYSTEM_LABEL[site.systemType].toUpperCase()}`, margin + 12, y - 20, helvBold, 11, ORANGE);
  text(p1, `LOCATION PSH: ${site.psh.toFixed(1)} kWh/m²/day`, W - margin - 200, y - 20, helv, 10, FAINT);

  // Summary stat cards
  y -= 60;
  const cardW = (W - margin * 2 - 24) / 4;
  const cards: [string, string][] = [
    ['Array size', `${(design.arrayWpActual / 1000).toFixed(2)} kWp`],
    ['Battery bank', design.batteryTotalCount ? `${design.batteryUsableKwh.toFixed(1)} kWh` : 'None'],
    ['Inverter', `${((design.inverter.continuousW * design.inverterCount) / 1000).toFixed(1)} kW`],
    ['Total cost', money(design.totalUsd)],
  ];
  cards.forEach(([label, value], i) => {
    const x = margin + i * (cardW + 8);
    p1.drawRectangle({ x, y: y - 60, width: cardW, height: 60, borderColor: rgb(0.89, 0.92, 0.95), borderWidth: 1, color: PAPER });
    text(p1, value, x + 10, y - 28, helvBold, 15, BLUE);
    text(p1, label.toUpperCase(), x + 10, y - 46, helv, 7.5, FAINT);
  });

  // System diagram (schematic)
  y -= 100;
  text(p1, 'System overview', margin, y, helvBold, 13, INK);
  y -= 20;
  const diagTop = y;
  const diagH = 140;
  p1.drawRectangle({ x: margin, y: diagTop - diagH, width: W - margin * 2, height: diagH, color: SOFT, borderColor: rgb(0.89, 0.92, 0.95), borderWidth: 1 });

  const nodeY = diagTop - diagH / 2 - 10;
  const isGridTied = site.systemType === 'GRID_TIED';
  const hasBattery = !isGridTied;
  const stages = ['PV Array', ...(design.controller ? ['Charge Ctrl'] : []), ...(hasBattery ? ['Battery'] : []), 'Inverter', 'Loads'];
  const stageLabels: Record<string, string> = {
    'PV Array': `${design.panelCount} x ${design.panel.wattage}W`,
    'Charge Ctrl': design.controller ? `${design.controller.type} ${design.chargeCurrentA.toFixed(0)}A` : '',
    Battery: design.batteryTotalCount ? `${design.batteryTotalCount} units, ${design.batteryUsableKwh.toFixed(1)} kWh` : '',
    Inverter: `${(design.inverter.continuousW * design.inverterCount / 1000).toFixed(1)} kW`,
    Loads: `${(design.peakLoadW / 1000).toFixed(2)} kW peak`,
  };
  const gap = (W - margin * 2 - 40) / stages.length;
  stages.forEach((s, i) => {
    const bx = margin + 20 + i * gap;
    const bw = gap - 16;
    p1.drawRectangle({ x: bx, y: nodeY - 20, width: bw, height: 40, color: PAPER, borderColor: BLUE_BRIGHT, borderWidth: 1.2 });
    const tw = helvBold.widthOfTextAtSize(s, 8.5);
    text(p1, s, bx + (bw - tw) / 2, nodeY + 4, helvBold, 8.5, BLUE);
    const sub = stageLabels[s] ?? '';
    const sw = helv.widthOfTextAtSize(sub, 7);
    text(p1, sub, bx + Math.max(2, (bw - sw) / 2), nodeY - 12, helv, 7, FAINT);
    if (i < stages.length - 1) {
      p1.drawLine({ start: { x: bx + bw, y: nodeY }, end: { x: bx + bw + 16, y: nodeY }, thickness: 1.5, color: ORANGE });
    }
  });

  text(p1, 'Indicative sizing only — final design must be verified by a qualified installer against a site survey,', margin, 70, helv, 8, FAINT);
  text(p1, 'roof structure/orientation, and local electrical wiring regulations.', margin, 58, helv, 8, FAINT);
  text(p1, 'SmartTech Academy — smarttech.academy', margin, 40, helvBold, 8.5, INK);

  // ---------- Page 2: BOM + financials + QR ----------
  const p2 = pdf.addPage([W, H]);
  p2.drawRectangle({ x: 0, y: 0, width: W, height: H, color: PAPER });
  p2.drawRectangle({ x: 0, y: H - 60, width: W, height: 60, color: BLUE });
  text(p2, 'Bill of Materials & Cost Breakdown', margin, H - 38, helvBold, 16, PAPER);

  let ty = H - 100;
  text(p2, 'ITEM', margin, ty, helvBold, 9, FAINT);
  text(p2, 'DETAIL', margin + 160, ty, helvBold, 9, FAINT);
  text(p2, 'QTY', margin + 340, ty, helvBold, 9, FAINT);
  text(p2, 'UNIT', margin + 385, ty, helvBold, 9, FAINT);
  text(p2, 'TOTAL', W - margin - 60, ty, helvBold, 9, FAINT);
  ty -= 8;
  p2.drawLine({ start: { x: margin, y: ty }, end: { x: W - margin, y: ty }, thickness: 1, color: rgb(0.89, 0.92, 0.95) });
  ty -= 18;

  for (const line of design.bom) {
    text(p2, line.label.slice(0, 30), margin, ty, helvBold, 9.5, INK);
    text(p2, line.detail.slice(0, 42), margin + 160, ty, helv, 8.5, FAINT);
    text(p2, String(line.qty), margin + 340, ty, helv, 9, INK);
    text(p2, money(line.unitPriceUsd), margin + 385, ty, helv, 9, INK);
    const totalStr = money(line.totalUsd);
    text(p2, totalStr, W - margin - helvBold.widthOfTextAtSize(totalStr, 9.5), ty, helvBold, 9.5, INK);
    ty -= 22;
  }

  ty -= 6;
  p2.drawLine({ start: { x: margin, y: ty }, end: { x: W - margin, y: ty }, thickness: 1, color: rgb(0.89, 0.92, 0.95) });
  ty -= 22;

  const totalsRow = (label: string, value: string, bold = false, big = false) => {
    const font = bold ? helvBold : helv;
    const size = big ? 14 : 10;
    text(p2, label, margin + 240, ty, font, size, bold ? INK : FAINT);
    const w = font.widthOfTextAtSize(value, size);
    text(p2, value, W - margin - w, ty, font, size, bold ? BLUE : INK);
    ty -= big ? 26 : 18;
  };
  totalsRow('Equipment subtotal', money(design.equipmentTotalUsd));
  totalsRow('Install & contingency buffer', money(design.installBufferUsd));
  p2.drawRectangle({ x: margin, y: ty - 4, width: W - margin * 2, height: 34, color: SOFT });
  ty -= 6;
  totalsRow('TOTAL SYSTEM COST', money(design.totalUsd), true, true);

  ty -= 30;
  text(p2, 'Financial summary', margin, ty, helvBold, 12, INK);
  ty -= 20;
  const finRows: [string, string][] = [
    ['Est. monthly production', `${design.estMonthlyProductionKwh.toFixed(0)} kWh`],
    ['Est. monthly savings', money(design.estMonthlySavingsUsd)],
    ['Estimated payback period', design.paybackYears ? `${design.paybackYears.toFixed(1)} years` : 'Not applicable'],
  ];
  finRows.forEach(([k, v]) => {
    text(p2, k, margin, ty, helv, 9.5, FAINT);
    text(p2, v, margin + 220, ty, helvBold, 9.5, INK);
    ty -= 18;
  });

  if (site.notes) {
    ty -= 12;
    text(p2, 'Notes', margin, ty, helvBold, 11, INK);
    ty -= 16;
    const words = site.notes.split(/\s+/);
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (helv.widthOfTextAtSize(test, 9) > W - margin * 2) {
        text(p2, line, margin, ty, helv, 9, FAINT);
        ty -= 13;
        line = word;
      } else {
        line = test;
      }
    }
    if (line) text(p2, line, margin, ty, helv, 9, FAINT);
  }

  // QR + footer
  const verifyUrl = `${appUrl}/solar-calculator`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 200, color: { dark: '#0b1526', light: '#ffffff' } });
  const qrImage = await pdf.embedPng(Buffer.from(qrDataUrl.split(',')[1], 'base64'));
  p2.drawImage(qrImage, { x: W - margin - 70, y: 40, width: 70, height: 70 });
  text(p2, 'Redesign / recalculate', W - margin - 70, 32, helv, 7, FAINT);
  text(p2, 'Prepared with SmartTech Solar Calculator', margin, 60, helvBold, 9, INK);
  text(p2, 'Indicative equipment, pricing and sizing — confirm with a licensed installer before purchase.', margin, 46, helv, 7.5, FAINT);

  pdf.setTitle(`SmartTech Solar Proposal — ${site.clientName || 'Design'}`);
  pdf.setAuthor('SmartTech Academy');
  pdf.setSubject('Solar system design proposal');

  return pdf.save();
}
