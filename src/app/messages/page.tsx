import Link from 'next/link';
import { redirect } from 'next/navigation';
import { listConversations, listContacts } from '@/lib/queries';
import { currentUser } from '@/lib/auth';

export default async function MessagesPage() {
  const user = await currentUser();
  if (!user) redirect('/login?next=/messages');

  const [conversations, contacts] = await Promise.all([
    listConversations(user.id),
    listContacts(user.id, user.role),
  ]);
  const conversationIds = new Set(conversations.map((c: any) => c.userId));
  const newContacts = contacts.filter((c: any) => !conversationIds.has(c.id));

  return (
    <div className="container-x max-w-3xl space-y-8 py-10">
      <div>
        <h1 className="h-display text-3xl">Messages</h1>
        <p className="mt-1 text-ink-faint">
          Direct messages with your {user.role === 'STUDENT' ? 'instructors' : user.role === 'INSTRUCTOR' ? 'students' : 'users'}.
        </p>
      </div>

      <section>
        <h2 className="h-display text-lg">Conversations</h2>
        <div className="card mt-3 divide-y divide-surface-line">
          {conversations.length === 0 && <p className="p-6 text-sm text-ink-faint">No messages yet — start one below.</p>}
          {conversations.map((c: any) => (
            <Link key={c.userId} href={`/messages/${c.userId}`} className="flex items-center justify-between gap-4 p-5 hover:bg-surface-soft/50">
              <div className="min-w-0">
                <p className="font-bold">{c.name}</p>
                <p className="mt-0.5 truncate text-sm text-ink-faint">{c.lastBody}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-xs text-ink-faint">{new Date(c.lastAt).toLocaleDateString()}</span>
                {c.unread > 0 && <span className="chip bg-brand-600 text-white">{c.unread}</span>}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {newContacts.length > 0 && (
        <section>
          <h2 className="h-display text-lg">Start a new conversation</h2>
          <div className="card mt-3 divide-y divide-surface-line">
            {newContacts.map((c: any) => (
              <Link key={c.id} href={`/messages/${c.id}`} className="flex items-center justify-between gap-4 p-5 hover:bg-surface-soft/50">
                <div>
                  <p className="font-bold">{c.name}</p>
                  <p className="text-xs text-ink-faint">{c.role === 'INSTRUCTOR' ? 'Instructor' : c.role === 'ADMIN' ? 'Admin' : 'Student'}</p>
                </div>
                <span className="text-sm font-semibold text-brand-600">Message →</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
