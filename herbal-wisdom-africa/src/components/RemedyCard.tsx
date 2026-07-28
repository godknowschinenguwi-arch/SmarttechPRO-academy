import Link from 'next/link';

export type RemedySummary = {
  id: string;
  herbName: string;
  herbLocalName: string | null;
  condition: string;
  region: string | null;
  outcome: string;
  authorName: string;
  createdAt: string;
  commentCount: number;
};

export default function RemedyCard({ remedy }: { remedy: RemedySummary }) {
  return (
    <Link href={`/remedies/${remedy.id}`} className="card block hover:shadow-lift transition-shadow">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold text-leaf-800">
          {remedy.herbName}
          {remedy.herbLocalName && <span className="ml-1 text-sm font-normal text-ink-faint">({remedy.herbLocalName})</span>}
        </h3>
        {remedy.region && <span className="text-xs text-ink-faint">{remedy.region}</span>}
      </div>
      <p className="mb-2 text-sm font-medium text-clay-700">for {remedy.condition}</p>
      <p className="line-clamp-3 text-sm text-ink-soft">{remedy.outcome}</p>
      <div className="mt-3 flex items-center justify-between text-xs text-ink-faint">
        <span>Shared by {remedy.authorName}</span>
        <span>{remedy.commentCount} comment{remedy.commentCount === 1 ? '' : 's'}</span>
      </div>
    </Link>
  );
}
