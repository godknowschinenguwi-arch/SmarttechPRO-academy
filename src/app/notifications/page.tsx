import Link from 'next/link';
import { redirect } from 'next/navigation';
import { listNotifications } from '@/lib/queries';
import { currentUser } from '@/lib/auth';
import { run } from '@/lib/db';

const KIND_ICON: Record<string, string> = {
  COURSE_UPDATE: '📚', ASSIGNMENT_DUE: '📝', QUIZ_RESULT: '🎯',
  CERT_READY: '📜', PRACTICAL_REMINDER: '🛠️', PAYMENT: '💳', MESSAGE: '💬',
};

export default async function NotificationsPage() {
  const user = await currentUser();
  if (!user) redirect('/login?next=/notifications');

  const notifications = await listNotifications(user.id);
  const unreadIds = notifications.filter((n: any) => !n.readAt).map((n: any) => n.id);
  if (unreadIds.length) await run(`UPDATE Notification SET readAt = datetime('now') WHERE userId = ? AND readAt IS NULL`, [user.id]);

  return (
    <div className="container-x max-w-3xl space-y-6 py-10">
      <div>
        <h1 className="h-display text-3xl">Notifications</h1>
        <p className="mt-1 text-ink-faint">Course updates, grading results, messages and reminders.</p>
      </div>

      <div className="card divide-y divide-surface-line">
        {notifications.length === 0 && <p className="p-8 text-center text-sm text-ink-faint">You're all caught up — nothing here yet.</p>}
        {notifications.map((n: any) => {
          const wasUnread = unreadIds.includes(n.id);
          const content = (
            <div className={`flex gap-4 p-5 ${wasUnread ? 'bg-brand-50/40' : ''}`}>
              <span className="text-2xl">{KIND_ICON[n.kind] ?? '🔔'}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold">{n.title}</p>
                  {wasUnread && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-600" />}
                </div>
                <p className="mt-0.5 text-sm text-ink-faint">{n.body}</p>
                <p className="mt-1 text-xs text-ink-faint">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
            </div>
          );
          return n.href ? (
            <Link key={n.id} href={n.href} className="block hover:bg-surface-soft/50">{content}</Link>
          ) : (
            <div key={n.id}>{content}</div>
          );
        })}
      </div>
    </div>
  );
}
