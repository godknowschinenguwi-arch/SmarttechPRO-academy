import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';

export default async function NewRemedyPage({ searchParams }: { searchParams: { error?: string } }) {
  const user = await currentUser();
  if (!user) redirect('/login?error=' + encodeURIComponent('Please log in to share your experience.'));

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-semibold text-ink">Share your experience</h1>
      <p className="mb-6 text-sm text-ink-soft">
        Tell the community which herb you used, what for, and what happened. Write from your own
        experience — avoid claiming a herb "cures" a serious illness.
      </p>
      {searchParams.error && (
        <div className="mb-4 rounded-lg border border-clay-200 bg-clay-50 px-3 py-2 text-sm text-clay-800">
          {searchParams.error}
        </div>
      )}
      <form action="/api/remedies" method="post" className="card space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-soft">Herb name</label>
          <input name="herbName" required className="input" placeholder="e.g. Moringa" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-soft">Local / traditional name (optional)</label>
          <input name="herbLocalName" className="input" placeholder="e.g. Umhlonyane" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-soft">Condition it was used for</label>
          <input name="condition" required className="input" placeholder="e.g. Common cold" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-soft">Region / country (optional)</label>
          <input name="region" className="input" placeholder="e.g. Zimbabwe" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-soft">How it was prepared</label>
          <textarea name="preparation" required rows={3} className="input" placeholder="e.g. Steeped fresh leaves in boiling water for 10 minutes" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-soft">Dosage / how it was used (optional)</label>
          <input name="dosage" className="input" placeholder="e.g. One cup, twice a day" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-soft">What happened — your outcome</label>
          <textarea name="outcome" required rows={4} className="input" placeholder="Describe your own experience honestly, in your own words" />
        </div>
        <button type="submit" className="btn-primary w-full">
          Post to the community
        </button>
      </form>
    </div>
  );
}
