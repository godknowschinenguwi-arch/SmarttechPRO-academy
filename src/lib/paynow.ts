// Paynow (Zimbabwe) integration — https://developers.paynow.co.zw
// Covers EcoCash, OneMoney, Visa/Mastercard via Paynow hosted checkout.
//
// Modes:
//  • LIVE — set PAYNOW_INTEGRATION_ID + PAYNOW_INTEGRATION_KEY: real initiate + SHA512 hash verification.
//  • SANDBOX (default) — no keys set: the app uses its built-in mock gateway at /pay/[reference]
//    so the full PENDING → redirect → webhook → PAID → entitlement flow works end-to-end in dev.

import { createHash } from 'crypto';

const ID = process.env.PAYNOW_INTEGRATION_ID;
const KEY = process.env.PAYNOW_INTEGRATION_KEY;
const APP = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const INITIATE_URL = 'https://www.paynow.co.zw/interface/initiatetransaction';

export const paynowLive = !!(ID && KEY);

// Paynow hash: SHA512 of all values (insertion order, excluding 'hash') + integration key, uppercased hex.
function computeHash(fields: Record<string, string>): string {
  const concat = Object.entries(fields)
    .filter(([k]) => k.toLowerCase() !== 'hash')
    .map(([, v]) => v)
    .join('');
  return createHash('sha512').update(concat + KEY).digest('hex').toUpperCase();
}

export function verifyPaynowHash(fields: Record<string, string>): boolean {
  if (!paynowLive) return true; // sandbox mode — mock webhook is accepted (guarded in the route)
  const given = fields['hash'] ?? fields['Hash'];
  if (!given) return false;
  return computeHash(fields) === given.toUpperCase();
}

export type InitiateResult = {
  redirectUrl: string;
  pollUrl: string | null;
  mode: 'live' | 'sandbox';
};

export async function initiatePaynow(opts: {
  reference: string;
  amountUsdCents: number;
  email: string;
  description: string;
}): Promise<InitiateResult> {
  if (!paynowLive) {
    return { redirectUrl: `${APP}/pay/${opts.reference}`, pollUrl: null, mode: 'sandbox' };
  }

  const fields: Record<string, string> = {
    id: ID!,
    reference: opts.reference,
    amount: (opts.amountUsdCents / 100).toFixed(2),
    additionalinfo: opts.description,
    returnurl: `${APP}/pay/return?ref=${opts.reference}`,
    resulturl: `${APP}/api/webhooks/paynow`,
    authemail: opts.email,
    status: 'Message',
  };
  fields.hash = computeHash(fields);

  const res = await fetch(INITIATE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(fields).toString(),
  });
  const text = await res.text();
  const parsed = Object.fromEntries(new URLSearchParams(text));

  if ((parsed.status ?? '').toLowerCase() !== 'ok') {
    throw new Error(`Paynow initiate failed: ${parsed.error ?? text}`);
  }
  return { redirectUrl: parsed.browserurl, pollUrl: parsed.pollurl ?? null, mode: 'live' };
}

// Server-to-server status poll (source of truth alongside the result webhook).
export async function pollPaynow(pollUrl: string): Promise<{ status: string; paid: boolean }> {
  const res = await fetch(pollUrl, { method: 'POST' });
  const parsed = Object.fromEntries(new URLSearchParams(await res.text()));
  if (paynowLive && !verifyPaynowHash(parsed as Record<string, string>)) {
    throw new Error('Paynow poll hash mismatch');
  }
  const status = (parsed.status ?? '').toLowerCase();
  return { status: parsed.status ?? 'unknown', paid: status === 'paid' || status === 'awaiting delivery' || status === 'delivered' };
}
