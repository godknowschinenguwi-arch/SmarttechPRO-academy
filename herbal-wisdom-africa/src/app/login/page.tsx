export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-1 text-2xl font-semibold text-ink">Log in</h1>
      <p className="mb-6 text-sm text-ink-soft">Welcome back.</p>
      {searchParams.error && (
        <div className="mb-4 rounded-lg border border-clay-200 bg-clay-50 px-3 py-2 text-sm text-clay-800">
          {searchParams.error}
        </div>
      )}
      <form action="/api/auth/login" method="post" className="card space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-soft">Email</label>
          <input name="email" type="email" required className="input" placeholder="you@example.com" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-soft">Password</label>
          <input name="password" type="password" required className="input" placeholder="Your password" />
        </div>
        <button type="submit" className="btn-primary w-full">
          Log in
        </button>
        <p className="text-center text-sm text-ink-faint">
          New here? <a href="/register" className="text-leaf-700 hover:underline">Create an account</a>
        </p>
        <p className="text-center text-xs text-ink-faint">
          Demo: thandiwe@herbalwisdom.africa / Password123!
        </p>
      </form>
    </div>
  );
}
