// Transactional email via Resend — https://resend.com
// SANDBOX (no RESEND_API_KEY set): logs to the console instead of sending, so
// registration, password reset and certificates keep working before a real
// email account exists. See docs/EMAIL.md for setup.

const API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM || 'SmartTech Academy <onboarding@resend.dev>';

export const emailConfigured = !!API_KEY;

export async function sendEmail(opts: { to: string; subject: string; html: string }): Promise<void> {
  if (!API_KEY) {
    const link = opts.html.match(/href="([^"]+)"/)?.[1];
    console.log(`[email:sandbox] Would send "${opts.subject}" to ${opts.to}${link ? `\n  Link: ${link}` : ''}`);
    return;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: opts.to, subject: opts.subject, html: opts.html }),
    });
    if (!res.ok) {
      console.error(`Failed to send email "${opts.subject}" to ${opts.to}: ${res.status} ${await res.text()}`);
    }
  } catch (err) {
    console.error(`Failed to send email "${opts.subject}" to ${opts.to}:`, err);
  }
}
