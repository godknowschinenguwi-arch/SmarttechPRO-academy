import { redirect } from 'next/navigation';
import Link from 'next/link';
import { currentUser } from '@/lib/auth';
import { all } from '@/lib/db';
import LeadsManager, { type LeadRow } from '@/components/admin/LeadsManager';

export default async function LeadsAdminPage() {
  const user = await currentUser();
  if (!user) redirect('/login?next=/admin/leads');
  if (user.role !== 'ADMIN') redirect('/dashboard');

  const leads = await all<LeadRow>(
    `SELECT l.id, l.source, l.name, l.phone, l.email, l.city, l.message, l.summary, l.totalUsd, l.status, l.createdAt, u.name AS claimedByName
     FROM Lead l LEFT JOIN User u ON u.id = l.claimedByUserId
     ORDER BY l.createdAt DESC LIMIT 300`
  );

  return (
    <div className="container-x space-y-6 py-10">
      <div>
        <Link href="/admin" className="text-sm font-semibold text-brand-600 hover:text-brand-800">← Admin console</Link>
        <h1 className="h-display mt-2 text-3xl">Leads &amp; quote requests</h1>
        <p className="mt-1 text-ink-faint">
          Leads submitted from the &quot;Request a quote&quot; form across the Solar, Electric Fence and CCTV
          calculators, including which installer claimed each one from the marketplace.
        </p>
      </div>

      <LeadsManager leads={leads} />
    </div>
  );
}
