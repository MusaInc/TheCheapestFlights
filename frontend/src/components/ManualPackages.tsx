'use client';

import type { ManualPackage } from '../lib/types';
import { formatMoney } from '../lib/format';

type ManualPackagesProps = {
  packages: ManualPackage[];
};

export default function ManualPackages({ packages }: ManualPackagesProps) {
  if (!packages || packages.length === 0) return null;

  return (
    <section className="rounded-2xl border border-[var(--border-light)] bg-white px-5 py-4 shadow-[var(--shadow-card)]">
      <div className="mb-4">
        <p className="text-sm font-semibold text-[var(--ink)]">Need a place to stay?</p>
        <p className="text-sm text-[var(--ink-muted)]">
          Browse hotel packages from trusted partners. Opens in a new tab.
        </p>
      </div>

      <div className="grid gap-3">
        {packages.map((item) => {
          const price =
            typeof item.priceFrom === 'number'
              ? `from ${formatMoney(item.priceFrom, item.currency || 'GBP')}${item.priceSuffix || ''}`
              : null;

          return (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-[var(--border-light)] p-4 transition hover:border-[var(--border)] hover:shadow-sm"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--ink)]">{item.title}</p>
                  {item.description ? (
                    <p className="mt-1 text-sm text-[var(--ink-muted)]">{item.description}</p>
                  ) : null}
                </div>
                {price ? (
                  <span className="text-sm font-medium text-[var(--ink)]">{price}</span>
                ) : null}
              </div>

              {item.highlights && item.highlights.length > 0 ? (
                <ul className="mt-3 grid gap-1 text-xs text-[var(--ink-muted)]">
                  {item.highlights.slice(0, 2).map((highlight, index) => (
                    <li key={`${item.id}-highlight-${index}`}>• {highlight}</li>
                  ))}
                </ul>
              ) : null}

              <div className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[var(--ink)]">
                <span className="rounded-lg border border-[var(--border)] bg-[var(--border-light)] px-3 py-1">
                  Browse hotels
                </span>
                <span className="text-xs text-[var(--ink-muted)]">Partner site</span>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
