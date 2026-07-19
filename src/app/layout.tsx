import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CurrencyProvider } from '@/components/CurrencyProvider';
import { currentUser } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'SmartTech Academy — Building Africa’s Next Generation of Skilled Technicians',
  description:
    'Professional online training for technical trades: CCTV, solar, networking, electrical, automation and AI. Learn online, practise hands-on, get certified.',
};

export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <CurrencyProvider>
          <Navbar user={user ? { name: user.name, role: user.role } : null} />
          <main className="flex-1">{children}</main>
          <Footer />
        </CurrencyProvider>
      </body>
    </html>
  );
}
