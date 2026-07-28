import type { Metadata } from 'next';
import './globals.css';
import DisclaimerBanner from '@/components/DisclaimerBanner';
import Nav from '@/components/Nav';

export const metadata: Metadata = {
  title: 'Herbal Wisdom Africa',
  description: 'A community where people share their real experiences using African herbs.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface text-ink antialiased">
        <DisclaimerBanner />
        <Nav />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-10 text-xs text-ink-faint">
          Herbal Wisdom Africa is a community platform. Content is shared by members and reflects
          personal experience, not professional medical guidance.
        </footer>
      </body>
    </html>
  );
}
