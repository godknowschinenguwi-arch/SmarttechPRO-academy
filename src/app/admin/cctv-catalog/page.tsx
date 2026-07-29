import { redirect } from 'next/navigation';
import Link from 'next/link';
import { currentUser } from '@/lib/auth';
import { cameraStore, nvrStore, hddStore, cableStore, poeSwitchStore, accessoryStore } from '@/lib/cctv/catalogDb';
import CctvCatalogManager from '@/components/admin/CctvCatalogManager';

export default async function CctvCatalogAdminPage() {
  const user = await currentUser();
  if (!user) redirect('/login?next=/admin/cctv-catalog');
  if (user.role !== 'ADMIN') redirect('/dashboard');

  const [cameras, nvrs, hdds, cables, poeSwitches, accessories] = await Promise.all([
    cameraStore.list(true),
    nvrStore.list(true),
    hddStore.list(true),
    cableStore.list(true),
    poeSwitchStore.list(true),
    accessoryStore.list(true),
  ]);

  return (
    <div className="container-x space-y-6 py-10">
      <div>
        <Link href="/admin" className="text-sm font-semibold text-brand-600 hover:text-brand-800">← Admin console</Link>
        <h1 className="h-display mt-2 text-3xl">CCTV equipment catalog</h1>
        <p className="mt-1 text-ink-faint">
          Add, edit, deactivate or remove cameras, NVR/DVRs, storage, cabling, PoE switches and accessories.
          Cameras and NVR/DVRs are tagged IP or Analog so the calculator never mixes systems. Changes apply
          immediately to the live CCTV Calculator — no redeploy needed.
        </p>
      </div>

      <CctvCatalogManager cameras={cameras} nvrs={nvrs} hdds={hdds} cables={cables} poeSwitches={poeSwitches} accessories={accessories} />
    </div>
  );
}
