import { redirect } from 'next/navigation';
import Link from 'next/link';
import { currentUser } from '@/lib/auth';
import { all } from '@/lib/db';
import SolarLeadsManager, { type SolarLeadRow } from '@/components/admin/SolarLeadsManager';

export default async function SolarLeadsAdminPage() {
  const user = await currentUser();
  if (!user) redirect('/login?next=/admin/solar-leads');
  if (user.role !== 'ADMIN') redirect('/dashboard');

  const leads = await all<SolarLeadRow>(
    `SELECT id, name, phone, email, city, message, systemType, totalUsd, arrayWpActual, batteryUsableKwh, status, createdAt
     FROM SolarLead ORDER BY createdAt DESC LIMIT 300`
  );

  return (
    <div className="container-x space-y-6 py-10">
      <div>
        <Link href="/admin" className="text-sm font-semibold text-brand-600 hover:text-brand-800">← Admin console</Link>
        <h1 className="h-display mt-2 text-3xl">Solar quote requests</h1>
        <p className="mt-1 text-ink-faint">
          Leads submitted from the &quot;Request a quote&quot; form on the public Solar Calculator, with a snapshot
          of the system they were quoted.
        </p>
      </div>

      <SolarLeadsManager leads={leads} />
    </div>
  );
}
