import { NextRequest, NextResponse } from 'next/server';
import { clientIp, rateLimit } from '@/lib/rateLimit';
import { computeSystemDesign } from '@/lib/solar/engine';
import { buildAssistantSystemPrompt } from '@/lib/solar/assistant';
import { sanitizeLoads, sanitizeSite, sanitizeCatalog } from '@/lib/solar/sanitize';

const MAX_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 1000;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function sanitizeMessages(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((m): m is Record<string, unknown> => !!m && typeof m === 'object')
    .map((m) => ({
      role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      content: typeof m.content === 'string' ? m.content.slice(0, MAX_MESSAGE_LENGTH) : '',
    }))
    .filter((m) => m.content.trim().length > 0)
    .slice(-MAX_MESSAGES);
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'The AI assistant is not configured on this deployment yet.' },
      { status: 503 }
    );
  }

  const limited = rateLimit(`solar-assistant:${clientIp(req)}`, 15, 60 * 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: 'Too many requests, please try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(limited.retryAfterSec) } }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });

  const messages = sanitizeMessages(body.messages);
  if (messages.length === 0) return NextResponse.json({ error: 'No message provided' }, { status: 400 });

  const loads = sanitizeLoads(body.loads);
  const site = sanitizeSite(body.site);
  const catalog = sanitizeCatalog(body.catalog);
  const design = computeSystemDesign(loads, site, {}, catalog);
  const system = buildAssistantSystemPrompt(loads, site, design);

  let anthropicRes: Response;
  try {
    anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        // Server-side fallback: if Opus 5's safety classifiers decline a benign
        // request, retry automatically on a fallback model instead of erroring.
        'anthropic-beta': 'server-side-fallback-2026-07-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-5',
        max_tokens: 1536,
        system,
        output_config: { effort: 'low' },
        fallbacks: 'default',
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });
  } catch {
    return NextResponse.json({ error: 'Could not reach the assistant. Please try again.' }, { status: 502 });
  }

  if (!anthropicRes.ok) {
    return NextResponse.json(
      { error: 'The assistant is temporarily unavailable. Please try again shortly.' },
      { status: anthropicRes.status === 429 ? 429 : 502 }
    );
  }

  const data = await anthropicRes.json();

  if (data.stop_reason === 'refusal') {
    return NextResponse.json({
      reply: "I can't help with that request. Try asking about your system's sizing, equipment, or costs.",
    });
  }

  const content: Array<{ type: string; text?: string }> = Array.isArray(data.content) ? data.content : [];
  const textBlock = content.find((b) => b.type === 'text');
  const reply = textBlock?.text?.trim() || "Sorry, I couldn't generate a response. Please try again.";

  return NextResponse.json({ reply });
}
