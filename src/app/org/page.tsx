import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { get, all } from '@/lib/db';
import OrgApp, { type OrgMemberRow } from './OrgApp';

export default async function OrgPage() {
  const user = await currentUser();
  if (!user) redirect('/login?next=/org');

  const org = await get<{ id: string; name: string; ownerId: string }>(
    `SELECT o.id, o.name, o.ownerId FROM Organization o
     JOIN OrganizationMember om ON om.organizationId = o.id
     WHERE om.userId = ? LIMIT 1`,
    [user.id]
  );

  if (!org) {
    return (
      <div className="bg-surface-soft pb-16">
        <div className="bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900 py-12 text-white">
          <div className="container-x flex flex-col gap-3">
            <span className="chip w-fit bg-white/15 text-white backdrop-blur">🏢 Employer Accounts</span>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">My Team</h1>
            <p className="max-w-2xl text-sm text-brand-100 sm:text-base">
              Create a team account to track your staff&apos;s training progress across all SmartTech Academy courses
              in one place.
            </p>
          </div>
        </div>
        <div className="container-x -mt-6">
          <OrgApp org={null} members={[]} isOwner={false} />
        </div>
      </div>
    );
  }

  const members = await all<OrgMemberRow>(
    `SELECT u.id AS userId, u.name, u.email, om.id AS memberId, om.role, om.joinedAt,
      (SELECT COUNT(*) FROM Enrollment e WHERE e.userId = u.id) AS enrollments,
      (SELECT COUNT(*) FROM Enrollment e WHERE e.userId = u.id AND e.status = 'COMPLETED') AS completedCourses,
      (SELECT COUNT(*) FROM Certificate c WHERE c.userId = u.id) AS certificates
     FROM OrganizationMember om JOIN User u ON u.id = om.userId
     WHERE om.organizationId = ?
     ORDER BY CASE om.role WHEN 'OWNER' THEN 0 ELSE 1 END, om.joinedAt ASC`,
    [org.id]
  );

  const isOwner = org.ownerId === user.id;

  return (
    <div className="bg-surface-soft pb-16">
      <div className="bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900 py-12 text-white">
        <div className="container-x flex flex-col gap-3">
          <span className="chip w-fit bg-white/15 text-white backdrop-blur">🏢 Employer Accounts</span>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{org.name}</h1>
          <p className="max-w-2xl text-sm text-brand-100 sm:text-base">
            Track your team&apos;s training progress across all SmartTech Academy courses in one place.
          </p>
        </div>
      </div>
      <div className="container-x -mt-6">
        <OrgApp org={{ id: org.id, name: org.name }} members={members} isOwner={isOwner} />
      </div>
    </div>
  );
}
