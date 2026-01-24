export default function Loading() {
  return (
    <div className="min-h-screen bg-[var(--sand)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-[var(--ink-muted)]">Loading...</p>
      </div>
    </div>
  );
}
