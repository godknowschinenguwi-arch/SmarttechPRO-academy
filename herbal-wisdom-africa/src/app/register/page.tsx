export default function RegisterPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-1 text-2xl font-semibold text-ink">Join the community</h1>
      <p className="mb-6 text-sm text-ink-soft">
        Create an account to share your own experiences with herbs and join the discussion.
      </p>
      {searchParams.error && (
        <div className="mb-4 rounded-lg border border-clay-200 bg-clay-50 px-3 py-2 text-sm text-clay-800">
          {searchParams.error}
        </div>
      )}
      <form action="/api/auth/register" method="post" className="card space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-soft">Name</label>
          <input name="name" required className="input" placeholder="Your name" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-soft">Email</label>
          <input name="email" type="email" required className="input" placeholder="you@example.com" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-soft">Country</label>
          <input name="country" className="input" placeholder="e.g. Zimbabwe" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-soft">Password</label>
          <input name="password" type="password" required minLength={8} className="input" placeholder="At least 8 characters" />
        </div>
        <button type="submit" className="btn-primary w-full">
          Create account
        </button>
        <p className="text-center text-sm text-ink-faint">
          Already have an account? <a href="/login" className="text-leaf-700 hover:underline">Log in</a>
        </p>
      </form>
    </div>
  );
}
