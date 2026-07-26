import type { DesignResult, SiteConfig } from './types';

export interface WhatsAppContact {
  name?: string;
  phone?: string;
  city?: string;
  message?: string;
}

export function buildQuoteWhatsAppMessage(design: DesignResult, site: SiteConfig, contact: WhatsAppContact = {}): string {
  const lines = ["Hi SmartTech Solar! I'd like a quote for this system.", ''];

  if (contact.name) lines.push(`👤 Name: ${contact.name}`);
  if (contact.phone) lines.push(`📞 Phone: ${contact.phone}`);
  const location = contact.city || site.siteName;
  if (location) lines.push(`📍 Location: ${location}`);

  lines.push('');
  lines.push(`⚡ System: ${site.systemType.replace('_', '-')} · ${(design.arrayWpActual / 1000).toFixed(2)}kWp`);
  if (design.batteryUsableKwh > 0) lines.push(`🔋 Battery: ${design.batteryUsableKwh.toFixed(1)}kWh`);
  lines.push(`💰 Estimated cost: $${design.totalUsd.toLocaleString()}`);

  if (contact.message) {
    lines.push('');
    lines.push(contact.message);
  }

  return lines.join('\n');
}
