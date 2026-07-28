import type { FenceDesignResult, FenceConfig } from './types';

export interface WhatsAppContact {
  name?: string;
  phone?: string;
  city?: string;
  message?: string;
}

export function buildFenceWhatsAppMessage(design: FenceDesignResult, config: FenceConfig, contact: WhatsAppContact = {}): string {
  const lines = ["Hi SmartTech Security! I'd like a quote for this electric fence.", ''];

  if (contact.name) lines.push(`👤 Name: ${contact.name}`);
  if (contact.phone) lines.push(`📞 Phone: ${contact.phone}`);
  const location = contact.city || config.siteName;
  if (location) lines.push(`📍 Location: ${location}`);

  lines.push('');
  lines.push(`🔌 Perimeter: ${(design.totalPerimeterM / 1000).toFixed(2)}km · ${design.energizer.joulesOutput}J energizer`);
  lines.push(`💰 Estimated cost: $${design.totalUsd.toLocaleString()}`);

  if (contact.message) {
    lines.push('');
    lines.push(contact.message);
  }

  return lines.join('\n');
}
