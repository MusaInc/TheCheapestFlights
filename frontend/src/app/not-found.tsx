import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--sand)] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--border-light)] flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🧭</span>
        </div>
        <h1 className="text-xl font-semibold text-[var(--ink)] mb-2">Page not found</h1>
        <p className="text-sm text-[var(--ink-muted)] mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Back to home
        </Link>
      </div>
    </div>
  );
}
