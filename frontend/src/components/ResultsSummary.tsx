import type { PackageDeal, PackageSearchParams } from '../lib/types';

interface ResultsSummaryProps {
  count: number;
  params: PackageSearchParams;
  disclaimer: string;
}

export default function ResultsSummary({ count, params, disclaimer }: ResultsSummaryProps) {
  if (count === 0) return null;

  return (
    <div className="flex flex-col gap-4 border-b border-clay/30 pb-6 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 className="font-display text-2xl text-ink">
          Found {count} packages for <span className="text-clay">{params.origin}</span>
        </h2>
        <div className="mt-2 flex flex-wrap gap-2 text-sm text-ink/60">
          <span className="rounded-full bg-clay/10 px-3 py-1">
            Budget: £{params.maxBudget}
          </span>
          <span className="rounded-full bg-clay/10 px-3 py-1">
            {params.nights} Nights
          </span>
          <span className="rounded-full bg-clay/10 px-3 py-1">
            {params.adults} Adults
          </span>
        </div>
      </div>

      <div className="text-right">
        <p className="text-xs text-ink/40 max-w-xs leading-relaxed">
          {disclaimer}
        </p>
      </div>
    </div>
  );
}