import type { WiringDesignResult, WiringConfig } from './types';

export interface WhatsAppContact {
  name?: string;
  phone?: string;
  city?: string;
  message?: string;
}

export function buildWiringWhatsAppMessage(design: WiringDesignResult, config: WiringConfig, contact: WhatsAppContact = {}): string {
  const lines = ["Hi SmartTech Electrical! I'd like a quote for this house wiring installation.", ''];

  if (contact.name) lines.push(`👤 Name: ${contact.name}`);
  if (contact.phone) lines.push(`📞 Phone: ${contact.phone}`);
  const location = contact.city || config.siteName;
  if (location) lines.push(`📍 Location: ${location}`);

  lines.push('');
  lines.push(`🔌 ${design.circuitCount} circuits · ${design.board.ways}-way DB · ${design.totalCableLengthM.toFixed(0)}m cable`);
  lines.push(`💰 Estimated cost: $${design.totalUsd.toLocaleString()}`);

  if (contact.message) {
    lines.push('');
    lines.push(contact.message);
  }

  return lines.join('\n');
}
