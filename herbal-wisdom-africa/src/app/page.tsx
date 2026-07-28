import { all } from '@/lib/db';
import RemedyCard, { type RemedySummary } from '@/components/RemedyCard';

export const dynamic = 'force-dynamic';

async function loadRemedies(q: string) {
  const like = `%${q.trim()}%`;
  const rows = q.trim()
    ? await all<RemedySummary>(
        `SELECT r.id, r.herbName, r.herbLocalName, r.condition, r.region, r.outcome, r.createdAt,
                u.name as authorName,
                (SELECT COUNT(*) FROM Comment c WHERE c.remedyId = r.id AND c.status = 'PUBLISHED') as commentCount
         FROM Remedy r JOIN User u ON u.id = r.authorId
         WHERE r.status = 'PUBLISHED' AND (r.herbName LIKE ? OR r.herbLocalName LIKE ? OR r.condition LIKE ?)
         ORDER BY r.createdAt DESC`,
        [like, like, like],
      )
    : await all<RemedySummary>(
        `SELECT r.id, r.herbName, r.herbLocalName, r.condition, r.region, r.outcome, r.createdAt,
                u.name as authorName,
                (SELECT COUNT(*) FROM Comment c WHERE c.remedyId = r.id AND c.status = 'PUBLISHED') as commentCount
         FROM Remedy r JOIN User u ON u.id = r.authorId
         WHERE r.status = 'PUBLISHED'
         ORDER BY r.createdAt DESC`,
      );
  return rows;
}

export default async function HomePage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q ?? '';
  const remedies = await loadRemedies(q);

  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold text-ink">Herbs that helped, in people's own words</h1>
        <p className="mx-auto max-w-2xl text-ink-soft">
          Browse real experiences shared by people across Africa — which herb, for what condition, how
          it was prepared, and what happened.
        </p>
      </div>

      <form action="/" method="get" className="mx-auto mb-8 flex max-w-xl gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by herb or condition, e.g. Moringa or headache"
          className="input"
        />
        <button type="submit" className="btn-primary shrink-0">
          Search
        </button>
      </form>

      {remedies.length === 0 ? (
        <p className="text-center text-ink-faint">No shared experiences found yet{q ? ` for "${q}"` : ''}.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {remedies.map((r) => (
            <RemedyCard key={r.id} remedy={r} />
          ))}
        </div>
      )}
    </div>
  );
}
