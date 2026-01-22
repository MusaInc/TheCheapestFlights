import type { PackageSearchParams } from '../lib/types';

const MOOD_LABELS: Record<PackageSearchParams['mood'], string> = {
  random: 'Any vibe',
  sun: 'Sun & sea',
  city: 'City break'
};

type ResultsSummaryProps = {
  count: number;
  params: PackageSearchParams;
  disclaimer?: string;
};

export default function ResultsSummary({ count, params, disclaimer }: ResultsSummaryProps) {
  return (
    <div className="rounded-3xl border border-clay/50 bg-white/80 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-ink/60">Results</p>
          <h3 className="font-display text-2xl text-ink">{count} live options</h3>
        </div>
        <div className="text-sm text-ink/60">
          {params.origin} | {params.nights} nights | {MOOD_LABELS[params.mood]}
        </div>
      </div>
      {disclaimer ? (
        <p className="mt-3 text-xs text-ink/50">{disclaimer}</p>
      ) : null}
    </div>
  );
}
