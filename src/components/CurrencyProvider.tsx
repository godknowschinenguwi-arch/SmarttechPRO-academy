'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { CURRENCIES, formatPrice, type CurrencyCode } from '@/lib/currency';

const Ctx = createContext<{ code: CurrencyCode; setCode: (c: CurrencyCode) => void }>({
  code: 'USD',
  setCode: () => {},
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [code, setCodeState] = useState<CurrencyCode>('USD');
  useEffect(() => {
    const saved = window.localStorage.getItem('sta_currency') as CurrencyCode | null;
    if (saved && saved in CURRENCIES) setCodeState(saved);
  }, []);
  const setCode = (c: CurrencyCode) => {
    setCodeState(c);
    window.localStorage.setItem('sta_currency', c);
  };
  return <Ctx.Provider value={{ code, setCode }}>{children}</Ctx.Provider>;
}

export const useCurrency = () => useContext(Ctx);

export function Price({ cents, className = '' }: { cents: number; className?: string }) {
  const { code } = useCurrency();
  return <span className={className}>{formatPrice(cents, code)}</span>;
}

export function CurrencySwitcher() {
  const { code, setCode } = useCurrency();
  return (
    <select
      aria-label="Currency"
      value={code}
      onChange={(e) => setCode(e.target.value as CurrencyCode)}
      className="rounded-lg border border-surface-line bg-white px-2 py-1.5 text-xs font-semibold text-ink-soft focus:outline-none focus:ring-2 focus:ring-brand-200"
    >
      {Object.keys(CURRENCIES).map((c) => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
  );
}
