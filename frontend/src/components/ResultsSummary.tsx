import type { PackageSearchParams } from '../lib/types';

interface ResultsSummaryProps {
  count: number;
  params: PackageSearchParams;
  disclaimer: string;
  isLoading?: boolean;
}

export default function ResultsSummary({ count, params, disclaimer, isLoading }: ResultsSummaryProps) {
  if (isLoading) {
    return (
      <div className="space-y-1">
        <div className="h-5 w-48 skeleton rounded" />
        <div className="h-4 w-32 skeleton rounded" />
      </div>
    );
  }

  if (count === 0) {
    return null;
  }

  const transportLabel = params.transportType === 'train'
    ? 'train'
    : params.transportType === 'flight'
    ? 'flight'
    : 'trip';

  return (
    <div>
      <h2 className="text-lg font-semibold text-[var(--ink)]">
        {count} {transportLabel}{count !== 1 ? 's' : ''} found
      </h2>
      <p className="text-sm text-[var(--ink-muted)]">
        From {params.origin} · Up to £{params.maxBudget.toLocaleString()} · {params.nights} nights
      </p>
    </div>
  );
}
