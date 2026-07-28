import { redirect } from 'next/navigation';
import Link from 'next/link';
import { currentUser } from '@/lib/auth';
import { energizerStore, wireStore, postStore, monitorStore, batteryStore } from '@/lib/electricfence/catalogDb';
import FenceCatalogManager from '@/components/admin/FenceCatalogManager';

export default async function FenceCatalogAdminPage() {
  const user = await currentUser();
  if (!user) redirect('/login?next=/admin/fence-catalog');
  if (user.role !== 'ADMIN') redirect('/dashboard');

  const [energizers, wires, posts, monitors, batteries] = await Promise.all([
    energizerStore.list(true),
    wireStore.list(true),
    postStore.list(true),
    monitorStore.list(true),
    batteryStore.list(true),
  ]);

  return (
    <div className="container-x space-y-6 py-10">
      <div>
        <Link href="/admin" className="text-sm font-semibold text-brand-600 hover:text-brand-800">← Admin console</Link>
        <h1 className="h-display mt-2 text-3xl">Electric fence equipment catalog</h1>
        <p className="mt-1 text-ink-faint">
          Add, edit, deactivate or remove energizers, wire, posts, monitors and backup batteries. Changes apply
          immediately to the live Electric Fence Calculator — no redeploy needed.
        </p>
      </div>

      <FenceCatalogManager energizers={energizers} wires={wires} posts={posts} monitors={monitors} batteries={batteries} />
    </div>
  );
}
