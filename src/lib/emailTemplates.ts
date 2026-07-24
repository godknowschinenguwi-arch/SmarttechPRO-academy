// Minimal inline-styled HTML templates — email clients don't support external CSS.
const NAVY = '#0b1526';
const ORANGE = '#f97316';

function shell(preheader: string, bodyHtml: string): string {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:${NAVY}">
    <p style="display:none;max-height:0;overflow:hidden">${preheader}</p>
    <p style="font-weight:800;color:${ORANGE};letter-spacing:2px;font-size:12px;text-transform:uppercase;margin:0 0 24px">SmartTech Academy</p>
    ${bodyHtml}
    <p style="margin-top:40px;font-size:12px;color:#68778f">SmartTech Academy · Harare, Zimbabwe</p>
  </div>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${ORANGE};color:#ffffff;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:10px;margin:20px 0">${label}</a>`;
}

export function welcomeEmail(name: string) {
  return {
    subject: 'Welcome to SmartTech Academy 🎉',
    html: shell('Your account is ready', `
      <h1 style="font-size:22px;margin:0 0 16px">Welcome, ${name}!</h1>
      <p style="font-size:15px;line-height:1.6">Your SmartTech Academy account is ready. Browse the course catalogue and start building job-ready technical skills — online theory, hands-on practicals, and a QR-verifiable certificate when you finish.</p>
      ${button(`${process.env.NEXT_PUBLIC_APP_URL || 'https://smarttech.academy'}/courses`, 'Browse Courses')}
    `),
  };
}

export function passwordResetEmail(resetUrl: string) {
  return {
    subject: 'Reset your SmartTech Academy password',
    html: shell('Reset your password', `
      <h1 style="font-size:22px;margin:0 0 16px">Reset your password</h1>
      <p style="font-size:15px;line-height:1.6">We received a request to reset your password. This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
      ${button(resetUrl, 'Reset Password')}
      <p style="font-size:13px;color:#68778f">Or paste this link into your browser: ${resetUrl}</p>
    `),
  };
}

export function certificateReadyEmail(name: string, courseTitle: string, verifyUrl: string) {
  return {
    subject: 'Your certificate is ready 🎓',
    html: shell('Certificate issued', `
      <h1 style="font-size:22px;margin:0 0 16px">Congratulations, ${name}!</h1>
      <p style="font-size:15px;line-height:1.6">You've completed <strong>${courseTitle}</strong> and your QR-verifiable certificate has been issued.</p>
      ${button(verifyUrl, 'View Your Certificate')}
    `),
  };
}

export function waitlistConfirmationEmail(courseTitle: string) {
  return {
    subject: `You're on the list for ${courseTitle}`,
    html: shell("You're on the waitlist", `
      <h1 style="font-size:22px;margin:0 0 16px">You're on the list 🎉</h1>
      <p style="font-size:15px;line-height:1.6">We'll email you the moment <strong>${courseTitle}</strong> opens for enrollment. No spam, just one message when it's ready.</p>
    `),
  };
}
