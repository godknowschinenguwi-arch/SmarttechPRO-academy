import { redirect } from 'next/navigation';
import { all } from '@/lib/db';
import { currentUser } from '@/lib/auth';

type FlagRow = {
  id: string;
  targetType: 'REMEDY' | 'COMMENT';
  targetId: string;
  reason: string;
  createdAt: string;
  reporterName: string;
  preview: string | null;
  targetStatus: string | null;
};

export default async function ModerationPage() {
  const user = await currentUser();
  if (!user) redirect('/login');
  if (user.role !== 'ADMIN') redirect('/');

  const remedyFlags = await all<FlagRow>(
    `SELECT f.id, f.targetType, f.targetId, f.reason, f.createdAt,
            u.name as reporterName,
            (r.herbName || ' — ' || r.condition) as preview,
            r.status as targetStatus
     FROM Flag f
     JOIN User u ON u.id = f.reporterId
     JOIN Remedy r ON r.id = f.targetId
     WHERE f.status = 'OPEN' AND f.targetType = 'REMEDY'
     ORDER BY f.createdAt DESC`,
  );

  const commentFlags = await all<FlagRow>(
    `SELECT f.id, f.targetType, f.targetId, f.reason, f.createdAt,
            u.name as reporterName,
            c.body as preview,
            c.status as targetStatus
     FROM Flag f
     JOIN User u ON u.id = f.reporterId
     JOIN Comment c ON c.id = f.targetId
     WHERE f.status = 'OPEN' AND f.targetType = 'COMMENT'
     ORDER BY f.createdAt DESC`,
  );

  const flags = [...remedyFlags, ...commentFlags].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-ink">Moderation queue</h1>
      <p className="mb-6 text-sm text-ink-soft">{flags.length} open report{flags.length === 1 ? '' : 's'}.</p>

      {flags.length === 0 ? (
        <p className="text-ink-faint">Nothing to review right now.</p>
      ) : (
        <div className="space-y-4">
          {flags.map((f) => (
            <div key={f.id} className="card">
              <div className="mb-2 flex items-center justify-between text-xs text-ink-faint">
                <span>
                  {f.targetType === 'REMEDY' ? 'Post' : 'Comment'} · reported by {f.reporterName}
                  {f.targetStatus === 'HIDDEN' && <span className="ml-2 text-clay-700">(already hidden)</span>}
                </span>
                <span>{new Date(f.createdAt).toLocaleString()}</span>
              </div>
              <p className="mb-2 text-sm text-ink">{f.preview}</p>
              <p className="mb-3 text-sm text-clay-800">Reason: {f.reason}</p>
              <div className="flex gap-2">
                <form action={`/api/admin/flags/${f.id}/resolve`} method="post">
                  <input type="hidden" name="action" value="hide" />
                  <button type="submit" className="btn-danger text-xs" disabled={f.targetStatus === 'HIDDEN'}>
                    Hide content
                  </button>
                </form>
                <form action={`/api/admin/flags/${f.id}/resolve`} method="post">
                  <input type="hidden" name="action" value="dismiss" />
                  <button type="submit" className="btn-secondary text-xs">
                    Dismiss report
                  </button>
                </form>
                <a
                  href={f.targetType === 'REMEDY' ? `/remedies/${f.targetId}` : '#'}
                  className="btn-secondary text-xs"
                >
                  View
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
