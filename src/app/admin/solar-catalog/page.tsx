import { redirect } from 'next/navigation';
import Link from 'next/link';
import { currentUser } from '@/lib/auth';
import { panelStore, batteryStore, inverterStore, controllerStore } from '@/lib/solar/catalogDb';
import SolarCatalogManager from '@/components/admin/SolarCatalogManager';

export default async function SolarCatalogAdminPage() {
  const user = await currentUser();
  if (!user) redirect('/login?next=/admin/solar-catalog');
  if (user.role !== 'ADMIN') redirect('/dashboard');

  const [panels, batteries, inverters, controllers] = await Promise.all([
    panelStore.list(true),
    batteryStore.list(true),
    inverterStore.list(true),
    controllerStore.list(true),
  ]);

  return (
    <div className="container-x space-y-6 py-10">
      <div>
        <Link href="/admin" className="text-sm font-semibold text-brand-600 hover:text-brand-800">← Admin console</Link>
        <h1 className="h-display mt-2 text-3xl">Solar equipment catalog</h1>
        <p className="mt-1 text-ink-faint">
          Add, edit, deactivate or remove panels, batteries, inverters and charge controllers. Changes apply
          immediately to the live Solar Calculator — no redeploy needed. Deactivated items stay available in
          saved designs but won&apos;t be recommended for new ones.
        </p>
      </div>

      <SolarCatalogManager panels={panels} batteries={batteries} inverters={inverters} controllers={controllers} />
    </div>
  );
}
