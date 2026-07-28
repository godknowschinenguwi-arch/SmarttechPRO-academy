import type { Metadata } from 'next';
import { all, get } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Leaderboard — SmartTech Academy',
  description: 'See the top-ranked technicians on SmartTech Academy by XP, level and learning streak.',
};

interface LeaderRow {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
  xp: number;
  level: number;
  streakDays: number;
  badgeCount: number;
}

const MEDAL = ['🥇', '🥈', '🥉'];

export default async function LeaderboardPage() {
  const user = await currentUser();

  const rows = await all<LeaderRow>(
    `SELECT u.id, u.name, u.city, u.country, u.xp, u.level, u.streakDays,
      (SELECT COUNT(*) FROM UserBadge ub WHERE ub.userId = u.id) AS badgeCount
     FROM User u WHERE u.role = 'STUDENT' ORDER BY u.xp DESC, u.streakDays DESC LIMIT 50`
  );

  let myRank: number | null = null;
  if (user) {
    const rankRow = await get<{ rank: number }>(
      "SELECT COUNT(*) + 1 AS rank FROM User WHERE role = 'STUDENT' AND xp > (SELECT xp FROM User WHERE id = ?)",
      [user.id]
    );
    myRank = rankRow?.rank ?? null;
  }

  return (
    <div className="bg-surface-soft pb-16">
      <div className="bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900 py-12 text-white">
        <div className="container-x flex flex-col gap-3">
          <span className="chip w-fit bg-white/15 text-white backdrop-blur">🏆 Leaderboard</span>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Top Technicians</h1>
          <p className="max-w-2xl text-sm text-brand-100 sm:text-base">
            Ranked by XP earned across every SmartTech Academy course — keep learning, keep your streak alive, and
            climb the board.
          </p>
        </div>
      </div>

      <div className="container-x -mt-6 flex flex-col gap-6">
        {user && user.role === 'STUDENT' && myRank && (
          <div className="card border-brand-200 bg-brand-50 p-4 text-sm text-brand-800">
            You&apos;re currently ranked <strong>#{myRank}</strong> with {user.xp} XP · Level {user.level} · 🔥 {user.streakDays} day streak.
          </div>
        )}

        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-line bg-surface-soft text-left text-[11px] font-bold uppercase tracking-wide text-ink-faint">
                <th className="px-4 py-2.5">Rank</th>
                <th className="px-4 py-2.5">Technician</th>
                <th className="px-4 py-2.5 text-right">Level</th>
                <th className="px-4 py-2.5 text-right">XP</th>
                <th className="px-4 py-2.5 text-right">Streak</th>
                <th className="px-4 py-2.5 text-right">Badges</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-line">
              {rows.map((r, i) => (
                <tr key={r.id} className={user?.id === r.id ? 'bg-brand-50/50' : undefined}>
                  <td className="px-4 py-3 font-display font-bold text-ink">{MEDAL[i] ?? `#${i + 1}`}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{r.name}</p>
                    {(r.city || r.country) && <p className="text-xs text-ink-faint">{[r.city, r.country].filter(Boolean).join(', ')}</p>}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-ink">{r.level}</td>
                  <td className="px-4 py-3 text-right font-bold text-brand-700">{r.xp.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">🔥 {r.streakDays}</td>
                  <td className="px-4 py-3 text-right">🏅 {r.badgeCount}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-faint">No students yet — be the first to earn XP!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
