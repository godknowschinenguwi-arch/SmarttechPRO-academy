import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getConversation, getMessageableUserIds } from '@/lib/queries';
import { currentUser } from '@/lib/auth';
import { get, run } from '@/lib/db';
import MessageComposer from '@/components/MessageComposer';

const ROLE_LABEL: Record<string, string> = { INSTRUCTOR: 'Instructor', ADMIN: 'Admin', STUDENT: 'Student' };

export default async function ThreadPage({ params }: { params: { userId: string } }) {
  const user = await currentUser();
  if (!user) redirect(`/login?next=/messages/${params.userId}`);
  if (params.userId === user.id) redirect('/messages');

  const other = await get<any>('SELECT id, name, role, avatarUrl FROM User WHERE id = ?', [params.userId]);
  if (!other) notFound();

  const allowed = await getMessageableUserIds(user.id, user.role);
  if (!allowed.has(other.id)) notFound();

  const messages = await getConversation(user.id, other.id);
  await run(`UPDATE Message SET readAt = datetime('now') WHERE senderId = ? AND recipientId = ? AND readAt IS NULL`, [other.id, user.id]);
  // Also clears the "new message" notification for this conversation, so the
  // bell badge doesn't keep counting something the user just read here.
  await run(
    `UPDATE Notification SET readAt = datetime('now') WHERE userId = ? AND kind = 'MESSAGE' AND href = ? AND readAt IS NULL`,
    [user.id, `/messages/${other.id}`]);

  return (
    <div className="container-x max-w-2xl space-y-6 py-10">
      <div>
        <Link href="/messages" className="text-xs font-semibold text-ink-faint hover:text-brand-700">← Messages</Link>
        <h1 className="h-display mt-1 text-2xl">{other.name}</h1>
        <p className="text-xs text-ink-faint">{ROLE_LABEL[other.role] ?? other.role}</p>
      </div>

      <div className="card flex min-h-[320px] flex-col gap-3 p-5">
        {messages.length === 0 && <p className="m-auto text-sm text-ink-faint">Say hello 👋</p>}
        {messages.map((m: any) => {
          const mine = m.senderId === user.id;
          return (
            <div key={m.id} className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${mine ? 'ml-auto bg-brand-600 text-white' : 'bg-surface-soft text-ink'}`}>
              <p className="whitespace-pre-wrap">{m.body}</p>
              <p className={`mt-1 text-[10px] ${mine ? 'text-white/60' : 'text-ink-faint'}`}>{new Date(m.createdAt).toLocaleString()}</p>
            </div>
          );
        })}
      </div>

      <MessageComposer recipientId={other.id} />
    </div>
  );
}
