'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export interface OrgMemberRow {
  userId: string;
  name: string;
  email: string;
  memberId: string;
  role: 'OWNER' | 'MEMBER';
  joinedAt: string;
  enrollments: number;
  completedCourses: number;
  certificates: number;
}

export default function OrgApp({
  org,
  members,
  isOwner,
}: {
  org: { id: string; name: string } | null;
  members: OrgMemberRow[];
  isOwner: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function createOrg(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not create your team.');
        return;
      }
      router.refresh();
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/org/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not add that team member.');
        return;
      }
      setEmail('');
      router.refresh();
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(memberId: string) {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/org/members/${memberId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not remove that team member.');
        return;
      }
      router.refresh();
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  if (!org) {
    return (
      <div className="card mx-auto max-w-md p-6">
        <h3 className="font-display text-sm font-bold text-ink">Create your team</h3>
        <p className="mt-1 text-xs text-ink-faint">
          You&apos;ll be the team owner and can add existing SmartTech Academy students by email.
        </p>
        <form onSubmit={createOrg} className="mt-4 flex flex-col gap-3">
          <input className="input" placeholder="Company / team name" value={name} onChange={(e) => setName(e.target.value)} required />
          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
          <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50">
            {busy ? 'Creating…' : 'Create team'}
          </button>
        </form>
      </div>
    );
  }

  const totalCerts = members.reduce((s, m) => s + m.certificates, 0);
  const totalEnrollments = members.reduce((s, m) => s + m.enrollments, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Team members" value={String(members.length)} />
        <Stat label="Total enrollments" value={String(totalEnrollments)} />
        <Stat label="Courses completed" value={String(members.reduce((s, m) => s + m.completedCourses, 0))} />
        <Stat label="Certificates earned" value={String(totalCerts)} />
      </div>

      {isOwner && (
        <div className="card p-4">
          <h3 className="mb-2 font-display text-sm font-bold text-ink">Add a team member</h3>
          <form onSubmit={addMember} className="flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              className="input flex-1"
              placeholder="Their SmartTech Academy account email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" disabled={busy} className="btn-primary shrink-0 disabled:opacity-50">
              {busy ? 'Adding…' : 'Add member'}
            </button>
          </form>
          <p className="mt-2 text-[11px] text-ink-faint">They must already have a SmartTech Academy account under this email.</p>
          {error && <p className="mt-2 text-xs font-semibold text-rose-600">{error}</p>}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="border-b border-surface-line bg-surface-soft px-4 py-2.5">
          <h3 className="font-display text-sm font-bold text-ink">Team roster</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-line text-left text-[11px] font-bold uppercase tracking-wide text-ink-faint">
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2 text-right">Enrollments</th>
              <th className="px-4 py-2 text-right">Completed</th>
              <th className="px-4 py-2 text-right">Certificates</th>
              {isOwner && <th className="px-4 py-2" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-line">
            {members.map((m) => (
              <tr key={m.memberId}>
                <td className="px-4 py-2.5">
                  <p className="font-semibold text-ink">{m.name}</p>
                  <p className="text-xs text-ink-faint">{m.email}</p>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`chip ${m.role === 'OWNER' ? 'bg-brand-50 text-brand-700' : 'bg-surface-soft text-ink-soft'}`}>{m.role}</span>
                </td>
                <td className="px-4 py-2.5 text-right">{m.enrollments}</td>
                <td className="px-4 py-2.5 text-right">{m.completedCourses}</td>
                <td className="px-4 py-2.5 text-right">{m.certificates}</td>
                {isOwner && (
                  <td className="px-4 py-2.5 text-right">
                    {m.role !== 'OWNER' && (
                      <button onClick={() => removeMember(m.memberId)} disabled={busy} className="text-xs font-bold text-rose-600 hover:underline disabled:opacity-50">
                        Remove
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-3 text-center">
      <p className="font-display text-lg font-bold text-brand-700">{value}</p>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{label}</p>
    </div>
  );
}
