'use client';
import { useState } from 'react';
import { whatsappLink } from '@/lib/contact';
import { buildQuoteWhatsAppMessage } from '@/lib/solar/whatsapp';
import type { DesignResult, LoadItem, SiteConfig, SolarCatalog } from '@/lib/solar/types';

export default function RequestQuoteModal({
  loads,
  site,
  catalog,
  design,
  onClose,
}: {
  loads: LoadItem[];
  site: SiteConfig;
  catalog: SolarCatalog;
  design: DesignResult;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ name: site.clientName || '', phone: '', email: '', city: '', message: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<'form' | 'whatsapp' | null>(null);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    if (!form.name.trim() || !form.phone.trim()) {
      setError('Name and phone number are required.');
      return false;
    }
    setError('');
    return true;
  }

  async function submitLead(): Promise<boolean> {
    const res = await fetch('/api/solar/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, loads, site, catalog }),
    });
    return res.ok;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      const ok = await submitLead();
      if (!ok) {
        setError('Could not submit your request. Please try again.');
        return;
      }
      setDone('form');
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  function sendViaWhatsApp() {
    if (!validate()) return;
    submitLead().catch(() => {});
    const url = whatsappLink(buildQuoteWhatsAppMessage(design, site, form));
    window.open(url, '_blank', 'noopener');
    setDone('whatsapp');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <span className="text-4xl">✅</span>
            <h3 className="font-display text-lg font-bold text-ink">{done === 'whatsapp' ? 'WhatsApp opened' : 'Request sent'}</h3>
            <p className="text-sm text-ink-faint">
              {done === 'whatsapp'
                ? `Send the pre-filled message to finish — we've noted your request too, so a SmartTech-trained installer can follow up on ${form.phone} either way.`
                : `Thanks, ${form.name.split(' ')[0]}! A SmartTech-trained installer will reach out to ${form.phone} shortly with next steps for this system.`}
            </p>
            <button className="btn-primary mt-2" onClick={onClose}>Close</button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-ink">Request a quote</h3>
                <p className="text-xs text-ink-faint">Send this design to an installer — we&apos;ll include the system summary automatically.</p>
              </div>
              <button type="button" onClick={onClose} className="text-ink-faint hover:text-ink" aria-label="Close">✕</button>
            </div>

            <input className="input" placeholder="Full name *" value={form.name} onChange={(e) => set('name', e.target.value)} required />
            <input className="input" placeholder="Phone number *" value={form.phone} onChange={(e) => set('phone', e.target.value)} required />
            <input type="email" className="input" placeholder="Email (optional)" value={form.email} onChange={(e) => set('email', e.target.value)} />
            <input className="input" placeholder="City / area (optional)" value={form.city} onChange={(e) => set('city', e.target.value)} />
            <textarea className="input" rows={3} placeholder="Anything else the installer should know? (optional)" value={form.message} onChange={(e) => set('message', e.target.value)} />

            {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

            <div className="flex gap-2">
              <button type="submit" disabled={busy} className="btn-accent flex-1 disabled:opacity-50">
                {busy ? 'Sending…' : 'Send request'}
              </button>
              <button
                type="button"
                onClick={sendViaWhatsApp}
                className="btn-ghost flex-1 !border-emerald-300 !text-emerald-700 hover:!bg-emerald-50"
              >
                💬 WhatsApp
              </button>
            </div>
            <p className="text-center text-[10.5px] text-ink-faint">
              We&apos;ll share your contact details and this system&apos;s load profile with a SmartTech installer partner.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
