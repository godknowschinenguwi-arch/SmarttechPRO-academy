import { notFound } from 'next/navigation';
import { get, all } from '@/lib/db';
import { currentUser } from '@/lib/auth';

type Remedy = {
  id: string;
  herbName: string;
  herbLocalName: string | null;
  condition: string;
  region: string | null;
  preparation: string;
  dosage: string | null;
  outcome: string;
  status: 'PUBLISHED' | 'HIDDEN';
  createdAt: string;
  authorId: string;
  authorName: string;
};

type Comment = {
  id: string;
  body: string;
  createdAt: string;
  authorId: string;
  authorName: string;
};

export default async function RemedyDetailPage({ params }: { params: { id: string } }) {
  const user = await currentUser();
  const remedy = await get<Remedy>(
    `SELECT r.*, u.name as authorName FROM Remedy r JOIN User u ON u.id = r.authorId WHERE r.id = ?`,
    [params.id],
  );
  if (!remedy) notFound();

  const isOwnerOrAdmin = user && (user.id === remedy.authorId || user.role === 'ADMIN');
  if (remedy.status === 'HIDDEN' && !isOwnerOrAdmin) {
    return (
      <div className="card mx-auto max-w-2xl text-center text-ink-soft">
        This post has been removed by moderators and is no longer visible.
      </div>
    );
  }

  const comments = await all<Comment>(
    `SELECT c.id, c.body, c.createdAt, c.authorId, u.name as authorName
     FROM Comment c JOIN User u ON u.id = c.authorId
     WHERE c.remedyId = ? AND c.status = 'PUBLISHED'
     ORDER BY c.createdAt ASC`,
    [params.id],
  );

  return (
    <div className="mx-auto max-w-2xl">
      {remedy.status === 'HIDDEN' && (
        <div className="mb-4 rounded-lg border border-clay-200 bg-clay-50 px-3 py-2 text-sm text-clay-800">
          This post has been hidden by moderators. Only you and admins can see it.
        </div>
      )}

      <div className="card mb-6">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-semibold text-leaf-800">
            {remedy.herbName}
            {remedy.herbLocalName && <span className="ml-2 text-base font-normal text-ink-faint">({remedy.herbLocalName})</span>}
          </h1>
          {remedy.region && <span className="text-sm text-ink-faint">{remedy.region}</span>}
        </div>
        <p className="mb-4 text-sm font-medium text-clay-700">for {remedy.condition}</p>

        <div className="space-y-3 text-sm text-ink">
          <div>
            <h2 className="font-semibold text-ink-soft">Preparation</h2>
            <p>{remedy.preparation}</p>
          </div>
          {remedy.dosage && (
            <div>
              <h2 className="font-semibold text-ink-soft">Dosage</h2>
              <p>{remedy.dosage}</p>
            </div>
          )}
          <div>
            <h2 className="font-semibold text-ink-soft">What happened</h2>
            <p className="whitespace-pre-wrap">{remedy.outcome}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-surface-line pt-3 text-xs text-ink-faint">
          <span>Shared by {remedy.authorName}</span>
          {user && (
            <form action={`/api/remedies/${remedy.id}/flag`} method="post" className="flex items-center gap-2">
              <input
                name="reason"
                required
                placeholder="Reason to report this post"
                className="input !w-56 !py-1 text-xs"
              />
              <button type="submit" className="text-clay-700 hover:underline">
                Report
              </button>
            </form>
          )}
        </div>
      </div>

      <h2 className="mb-3 text-lg font-semibold text-ink">Discussion ({comments.length})</h2>
      <div className="space-y-3">
        {comments.map((c) => (
          <div key={c.id} className="card">
            <p className="text-sm text-ink">{c.body}</p>
            <div className="mt-2 flex items-center justify-between text-xs text-ink-faint">
              <span>{c.authorName}</span>
              {user && (
                <form action={`/api/comments/${c.id}/flag`} method="post" className="flex items-center gap-2">
                  <input name="reason" required placeholder="Reason" className="input !w-32 !py-1 text-xs" />
                  <button type="submit" className="text-clay-700 hover:underline">
                    Report
                  </button>
                </form>
              )}
            </div>
          </div>
        ))}
        {comments.length === 0 && <p className="text-sm text-ink-faint">No comments yet.</p>}
      </div>

      {user ? (
        <form action={`/api/remedies/${remedy.id}/comments`} method="post" className="card mt-4 space-y-3">
          <label className="block text-sm font-medium text-ink-soft">Add a comment</label>
          <textarea name="body" required rows={3} className="input" placeholder="Share your thoughts or your own experience with this herb" />
          <button type="submit" className="btn-primary">
            Post comment
          </button>
        </form>
      ) : (
        <p className="mt-4 text-sm text-ink-faint">
          <a href="/login" className="text-leaf-700 hover:underline">Log in</a> to join the discussion.
        </p>
      )}
    </div>
  );
}
