'use client';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import { useStandalone } from '@/lib/solar/useStandalone';

type NavUser = { name: string; role: string } | null;

// When the Solar Calculator is installed as its own PWA and launched in
// standalone display mode, drop the Academy site chrome so it reads as a
// separate app rather than an embedded page.
export default function SiteChrome({ user, children }: { user: NavUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const standalone = useStandalone();
  const hideChrome = standalone && !!pathname?.startsWith('/solar-calculator');

  return (
    <>
      {!hideChrome && <Navbar user={user} />}
      <main className="flex-1">{children}</main>
      {!hideChrome && <Footer />}
    </>
  );
}
