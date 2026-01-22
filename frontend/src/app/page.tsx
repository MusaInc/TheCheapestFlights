'use client';

import { useEffect, useRef, useState } from 'react';
import PackageCard from '../components/PackageCard';
import PackageMap from '../components/PackageMap';
import ResultsSummary from '../components/ResultsSummary';
import SearchPanel from '../components/SearchPanel';
import { searchPackages } from '../lib/api';
import type { PackageDeal, PackageSearchParams, PackageSearchResponse } from '../lib/types';

const DEFAULT_PARAMS: PackageSearchParams = {
  origin: 'LON',
  maxBudget: 500,
  nights: 4,
  adults: 2,
  mood: 'random'
};

export default function HomePage() {
  const [params, setParams] = useState<PackageSearchParams>(DEFAULT_PARAMS);
  const [packages, setPackages] = useState<PackageDeal[]>([]);
  const [summary, setSummary] = useState<PackageSearchResponse | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const runSearch = async (searchParams: PackageSearchParams) => {
    setIsLoading(true);
    setError(null);

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const response = await searchPackages(searchParams, controller.signal);
      setPackages(response.data);
      setSummary(response);
      setSelectedId(response.data[0]?.id || null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runSearch(DEFAULT_PARAMS);
  }, []);

  return (
    <main className="min-h-screen bg-hero px-6 pb-20 pt-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-lagoon">Live holiday discovery</p>
            <h1 className="font-display text-3xl text-ink">The Cheapest Flights</h1>
          </div>
          <div className="rounded-full border border-clay/40 bg-white/70 px-4 py-2 text-xs text-ink/70">
            Powered by Amadeus + Booking.com affiliate links
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-4xl leading-tight text-ink">
                Real flight prices, paired with smart hotel estimates.
              </h2>
              <p className="mt-3 max-w-xl text-base text-ink/70">
                Tell us where you fly from and your budget. We scan dozens of destinations and surface the cheapest
                combinations across multiple dates.
              </p>
            </div>
            <SearchPanel
              params={params}
              onChange={setParams}
              onSubmit={() => runSearch(params)}
              isLoading={isLoading}
            />
            {error ? (
              <div className="rounded-2xl border border-red-200 bg-white/80 p-4 text-sm text-red-700">
                {error}
              </div>
            ) : null}
          </div>

          <div className="rounded-3xl border border-clay/30 bg-white/80 p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.2em] text-ink/60">How this works</p>
            <ol className="mt-4 space-y-4 text-sm text-ink/70">
              <li>
                1. We call the Amadeus Flight Offers Search API to find real fares for the next 6 months.
              </li>
              <li>
                2. We generate Booking.com affiliate search links for hotels on matching dates.
              </li>
              <li>
                3. Packages are ranked by total estimate, with transparency on price breakdowns.
              </li>
            </ol>
            <p className="mt-6 text-xs text-ink/60">
              We never scrape prices. All flight data comes directly from Amadeus, and hotels open on Booking.com.
            </p>
          </div>
        </section>

        <section className="space-y-6">
          <ResultsSummary
            count={packages.length}
            params={summary?.searchParams || params}
            disclaimer={summary?.disclaimer}
          />

          {isLoading ? (
            <div className="rounded-3xl border border-clay/30 bg-white/80 p-6 text-sm text-ink/70">
              Fetching live fares and hotel links...
            </div>
          ) : null}

          {!isLoading && packages.length === 0 ? (
            <div className="rounded-3xl border border-clay/30 bg-white/80 p-6 text-sm text-ink/70">
              No packages fit this budget today. Try increasing your budget or switching mood.
            </div>
          ) : null}

          {packages.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <PackageMap
                packages={packages}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />

              <div className="space-y-4">
                {packages.map((deal) => (
                  <PackageCard
                    key={deal.id}
                    deal={deal}
                    isSelected={deal.id === selectedId}
                    onSelect={setSelectedId}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <footer className="rounded-3xl border border-clay/30 bg-white/70 p-6 text-xs text-ink/60">
          <p>
            Prices are indicative and subject to availability at time of booking. We may earn a commission from
            Booking.com when you book through our links. Flight pricing data is provided by Amadeus.
          </p>
        </footer>
      </div>
    </main>
  );
}
