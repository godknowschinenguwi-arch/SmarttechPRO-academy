// Shared "request a quote" lead capture used by all three calculators
// (Solar, Electric Fence, CCTV). Feeds the admin review panel and the
// installer marketplace.
import { insert } from './db';

export type LeadSource = 'SOLAR' | 'FENCE' | 'CCTV';

export interface CreateLeadInput {
  source: LeadSource;
  name: string;
  phone: string;
  email?: string | null;
  city?: string | null;
  message?: string | null;
  summary: string;
  totalUsd: number;
  payload: unknown;
}

export async function createLead(input: CreateLeadInput): Promise<string> {
  return insert('Lead', {
    source: input.source,
    name: input.name,
    phone: input.phone,
    email: input.email || null,
    city: input.city || null,
    message: input.message || null,
    summary: input.summary,
    totalUsd: input.totalUsd,
    payload: JSON.stringify(input.payload),
  });
}
