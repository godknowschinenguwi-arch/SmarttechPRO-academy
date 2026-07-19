'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VerifyIndexPage() {
  const [serial, setSerial] = useState('');
  const router = useRouter();

  return (
    <div className="container-x flex justify-center py-20">
      <div className="card w-full max-w-lg p-8 text-center">
        <span className="text-4xl">🔍</span>
        <h1 className="h-display mt-4 text-2xl">Verify a certificate</h1>
        <p className="mt-2 text-sm text-ink-faint">
          Enter the certificate serial number (e.g. STA-2026-000117) or scan the QR code printed on the certificate.
        </p>
        <form
          className="mt-6 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (serial.trim()) router.push(`/verify/${encodeURIComponent(serial.trim())}`);
          }}
        >
          <input
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
            required
            placeholder="STA-2026-000117"
            className="input font-mono"
          />
          <button type="submit" className="btn-primary">Verify</button>
        </form>
      </div>
    </div>
  );
}
