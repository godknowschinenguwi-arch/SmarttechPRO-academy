import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import MarketplaceApp from './MarketplaceApp';

export default async function MarketplacePage() {
  const user = await currentUser();
  if (!user) redirect('/login?next=/marketplace');

  return (
    <div className="bg-surface-soft pb-16">
      <div className="bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900 py-12 text-white">
        <div className="container-x flex flex-col gap-3">
          <span className="chip w-fit bg-white/15 text-white backdrop-blur">🤝 SmartTech Marketplace</span>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Installer Marketplace</h1>
          <p className="max-w-2xl text-sm text-brand-100 sm:text-base">
            Real quote requests from the Solar, Electric Fence and CCTV calculators — claim a lead to reveal the
            client&apos;s contact details and follow up directly.
          </p>
        </div>
      </div>
      <div className="container-x -mt-6 flex flex-col gap-6">
        <MarketplaceApp />
      </div>
    </div>
  );
}
