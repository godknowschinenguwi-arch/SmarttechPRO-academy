import { redirect } from 'next/navigation';
import Link from 'next/link';
import { currentUser } from '@/lib/auth';
import { cableStore, conduitStore, boardStore, breakerStore, accessoryStore } from '@/lib/wiring/catalogDb';
import WiringCatalogManager from '@/components/admin/WiringCatalogManager';

export default async function WiringCatalogAdminPage() {
  const user = await currentUser();
  if (!user) redirect('/login?next=/admin/wiring-catalog');
  if (user.role !== 'ADMIN') redirect('/dashboard');

  const [cables, conduits, boards, breakers, accessories] = await Promise.all([
    cableStore.list(true),
    conduitStore.list(true),
    boardStore.list(true),
    breakerStore.list(true),
    accessoryStore.list(true),
  ]);

  return (
    <div className="container-x space-y-6 py-10">
      <div>
        <Link href="/admin" className="text-sm font-semibold text-brand-600 hover:text-brand-800">← Admin console</Link>
        <h1 className="h-display mt-2 text-3xl">House wiring equipment catalog</h1>
        <p className="mt-1 text-ink-faint">
          Add, edit, deactivate or remove cable, conduit, distribution boards, breakers and accessories. Changes
          apply immediately to the live House Wiring Calculator — no redeploy needed.
        </p>
      </div>

      <WiringCatalogManager cables={cables} conduits={conduits} boards={boards} breakers={breakers} accessories={accessories} />
    </div>
  );
}
