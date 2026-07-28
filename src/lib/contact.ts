export const WHATSAPP_NUMBER = '263778907945';

export function whatsappLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

// Click-to-chat link to an arbitrary phone number (e.g. a claimed lead's
// contact number), rather than SmartTech's own WhatsApp number.
export function whatsappLinkTo(phone: string, message: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
