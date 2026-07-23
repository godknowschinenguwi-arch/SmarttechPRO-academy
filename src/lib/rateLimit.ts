// Fixed-window rate limiter, in-memory per server instance.
// Good enough for a single-instance deploy (Railway/Fly/Docker) and still
// limits abuse per cold start on serverless (Vercel). If you scale to many
// concurrent serverless instances, swap the Map below for Upstash Redis
// (same interface) so the window is shared across instances.

const hits = new Map<string, { count: number; resetAt: number }>();

// Periodically drop expired entries so this doesn't grow unbounded.
setInterval(() => {
  const now = Date.now();
  hits.forEach((v, key) => { if (v.resetAt <= now) hits.delete(key); });
}, 5 * 60_000).unref?.();

export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  return fwd?.split(',')[0].trim() || 'unknown';
}

/** Returns { ok: true } if within limit, else { ok: false, retryAfterSec }. */
export function rateLimit(key: string, limit: number, windowMs: number): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (entry.count >= limit) {
    return { ok: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count += 1;
  return { ok: true };
}
