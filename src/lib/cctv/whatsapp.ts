import type { CctvDesignResult, CctvConfig } from './types';

export interface WhatsAppContact {
  name?: string;
  phone?: string;
  city?: string;
  message?: string;
}

export function buildCctvWhatsAppMessage(design: CctvDesignResult, config: CctvConfig, contact: WhatsAppContact = {}): string {
  const lines = ["Hi SmartTech Security! I'd like a quote for this CCTV system.", ''];

  if (contact.name) lines.push(`👤 Name: ${contact.name}`);
  if (contact.phone) lines.push(`📞 Phone: ${contact.phone}`);
  const location = contact.city || config.siteName;
  if (location) lines.push(`📍 Location: ${location}`);

  lines.push('');
  lines.push(`📹 ${config.systemType === 'IP' ? 'IP' : 'Analog'} system · Cameras: ${design.cameraCount} · ${design.nvr.channels}CH ${config.systemType === 'IP' ? 'NVR' : 'DVR'} · ${design.totalStorageTb.toFixed(1)}TB storage`);
  lines.push(`💰 Estimated cost: $${design.totalUsd.toLocaleString()}`);

  if (contact.message) {
    lines.push('');
    lines.push(contact.message);
  }

  return lines.join('\n');
}
