'use client';

import { useEffect, useRef, useState } from 'react';
import PackageCard from '../components/PackageCard';
import PackageMap from '../components/PackageMap';
import ResultsSummary from '../components/ResultsSummary';
import SearchPanel from '../components/SearchPanel';
import HotelPartnerLink from '../components/HotelPartnerLink';
import ManualPackages from '../components/ManualPackages';
import { searchPackages } from '../lib/api';
import type { PackageDeal, PackageSearchParams, PackageSearchResponse } from '../lib/types';

const DEFAULT_PARAMS: PackageSearchParams = {
  origin: 'LON',
  maxBudget: 1500,
  nights: 4,
  adults: 2,
  mood: 'random',
  transportType: 'any'
};

export default function HomePage() {
  const [params, setParams] = useState<PackageSearchParams>(DEFAULT_PARAMS);
  const [packages, setPackages] = useState<PackageDeal[]>([]);
  const [summary, setSummary] = useState<PackageSearchResponse | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showMap, setShowMap] = useState(true);
  const controllerRef = useRef<AbortController | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const selectedDeal =
    packages.find((deal) => deal.id === selectedId) || (packages.length > 0 ? packages[0] : null);
  const manualPackages = summary?.manualPackages || [];

  const runSearch = async (searchParams: PackageSearchParams) => {
    setIsLoading(true);
    setError(null);
    if (controllerRef.current) controllerRef.current.abort();

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const normalizedOrigin = searchParams.origin.trim().toUpperCase();
      const shouldForceFlight =
        searchParams.transportType === 'train' && !['LON', 'LONDON'].includes(normalizedOrigin);
      const sanitizedParams = shouldForceFlight
        ? { ...searchParams, transportType: 'flight' }
        : searchParams;

      if (sanitizedParams !== searchParams) {
        setParams(sanitizedParams);
      }

      const response = await searchPackages(sanitizedParams, controller.signal);
      setPackages(response.data);
      setSummary(response);
      if (response.data?.length > 0) {
        setSelectedId(response.data[0].id);
      } else {
        setSelectedId(null);
      }
      setExpandedId(null);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Something went wrong.');
      }
    } finally {
      if (controllerRef.current === controller) setIsLoading(false);
    }
  };

  useEffect(() => {
    runSearch(DEFAULT_PARAMS);
    return () => controllerRef.current?.abort();
  }, []);

  const isFallback = summary?.exactMatch === false;

  const handleToggle = (id: string) => {
    setSelectedId(id);
    setExpandedId((current) => (current === id ? null : id));
  };

  const handleMapSelect = (id: string) => {
    setSelectedId(id);
    setExpandedId((current) => (current === id ? current : id));
  };

  return (
    <main className="min-h-screen bg-[var(--sand)] pb-24">
      {/* Header */}
      <header className="border-b border-[var(--border-light)] bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-[var(--ink)]">
                CheapAsTrips
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[var(--success-soft)] px-2 py-0.5 text-xs font-medium text-[var(--success)]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--success)] opacity-75"></span>
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--success)]"></span>
                </span>
                Live prices
              </span>
            </div>
            <p className="text-sm text-[var(--ink-muted)] hidden md:block">
              Flights, trains + hotels
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-4 md:px-6 lg:px-8 pt-6 lg:pt-8">
        <div className="grid gap-6 lg:gap-8 lg:grid-cols-[340px_1fr]">

          {/* Search Panel */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl bg-white border border-[var(--border-light)] p-5 shadow-[var(--shadow-card)]">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-[var(--ink)]">Find your trip</h2>
                <p className="text-sm text-[var(--ink-muted)] mt-0.5">Search real prices from London</p>
              </div>
              <SearchPanel
                params={params}
                onChange={setParams}
                onSubmit={() => runSearch(params)}
                isLoading={isLoading}
              />
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <p className="font-medium">Unable to load results</p>
                <p className="mt-1 text-red-600">{error}</p>
              </div>
            )}
          </aside>

          {/* Results Section */}
          <section ref={resultsRef} className="space-y-5">

            {/* Results Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <ResultsSummary
                count={packages.length}
                params={summary?.searchParams || params}
                disclaimer={summary?.disclaimer || ''}
                isLoading={isLoading}
              />

              <div className="flex items-center gap-2">
                {/* Map Toggle */}
                <button
                  onClick={() => setShowMap(!showMap)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    showMap
                      ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                      : 'bg-[var(--border-light)] text-[var(--ink-muted)] hover:bg-[var(--border)]'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <span className="hidden sm:inline">Map</span>
                </button>

                {/* View Toggle */}
                <div className="flex rounded-lg bg-[var(--border-light)] p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-white text-[var(--ink)] shadow-sm'
                        : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                    }`}
                    aria-label="Grid view"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      viewMode === 'list'
                        ? 'bg-white text-[var(--ink)] shadow-sm'
                        : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                    }`}
                    aria-label="List view"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Budget Fallback Notice */}
            {isFallback && !isLoading && packages.length > 0 && (
              <div className="flex items-start gap-3 rounded-xl border border-[var(--warning-soft)] bg-[var(--warning-soft)]/30 p-4">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--warning)] flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--warning)]">
                    Limited options under £{params.maxBudget}
                  </p>
                  <p className="text-sm text-[var(--ink-muted)] mt-0.5">
                    We've included the best-value alternatives. Consider increasing your budget or adjusting dates.
                  </p>
                </div>
              </div>
            )}

            {/* Map */}
            {showMap && !isLoading && packages.length > 0 && (
              <div className="rounded-2xl overflow-hidden border border-[var(--border-light)] bg-white shadow-[var(--shadow-card)]">
                <PackageMap
                  packages={packages}
                  selectedId={selectedId}
                  onSelect={handleMapSelect}
                />
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-[var(--ink-muted)]">
                  <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">Searching for the best deals...</span>
                </div>
                <div className={viewMode === 'grid'
                  ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                  : "flex flex-col gap-4 max-w-3xl"
                }>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="rounded-2xl bg-white border border-[var(--border-light)] overflow-hidden"
                    >
                      <div className="h-44 skeleton" />
                      <div className="p-4 space-y-3">
                        <div className="h-4 w-24 skeleton rounded" />
                        <div className="h-5 w-3/4 skeleton rounded" />
                        <div className="h-4 w-1/2 skeleton rounded" />
                        <div className="flex justify-between pt-2">
                          <div className="h-8 w-20 skeleton rounded-lg" />
                          <div className="h-8 w-24 skeleton rounded-lg" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Results Grid */}
            {!isLoading && packages.length > 0 && (
              <div className={
                viewMode === 'grid'
                  ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                  : "flex flex-col gap-4 max-w-3xl"
              }>
                {packages.map((deal) => (
                  <PackageCard
                    key={deal.id}
                    deal={deal}
                    isSelected={deal.id === selectedId}
                    isExpanded={deal.id === expandedId}
                    onSelect={setSelectedId}
                    onToggle={handleToggle}
                    layout={viewMode}
                  />
                ))}
              </div>
            )}
            
            {!isLoading && packages.length > 0 && selectedDeal?.hotel?.partnerLink && (
              <HotelPartnerLink
                city={selectedDeal.city}
                link={selectedDeal.hotel.partnerLink}
                partnerName={selectedDeal.hotel.partnerName}
              />
            )}

            {/* Empty State */}
            {!isLoading && packages.length === 0 && !error && (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-[var(--border)] bg-white">
                <div className="w-16 h-16 rounded-full bg-[var(--border-light)] flex items-center justify-center mb-4">
                  {params.transportType === 'train' ? (
                    <span className="text-3xl">🚄</span>
                  ) : (
                    <span className="text-3xl">✈️</span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-[var(--ink)]">No trips found</h3>
                <p className="text-sm text-[var(--ink-muted)] mt-2 max-w-sm">
                  {params.transportType === 'train'
                    ? 'Train routes are limited. Try switching to flights or expanding your budget.'
                    : 'Try a different trip vibe or increase your budget to see more options.'}
                </p>
                <button
                  onClick={() => {
                    setParams({ ...params, maxBudget: Math.min(params.maxBudget + 500, 5000) });
                  }}
                  className="mt-4 text-sm font-medium text-[var(--accent)] hover:underline"
                >
                  Increase budget to £{Math.min(params.maxBudget + 500, 5000)}
                </button>
              </div>
            )}

            {!isLoading && packages.length === 0 && !error && manualPackages.length > 0 && (
              <ManualPackages packages={manualPackages} />
            )}


            {/* Footer Disclaimer */}
            {!isLoading && packages.length > 0 && (
              <div className="pt-6 border-t border-[var(--border-light)]">
                <p className="disclaimer text-center max-w-2xl mx-auto">
                  Prices shown are estimates based on recent searches and may change.
                  Always verify final prices on booking sites before purchase.
                  We may earn a commission from partner bookings.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
