'use client';

import { useEffect, useRef, useState } from 'react';
import PackageCard from '../components/PackageCard';
import ResultsSummary from '../components/ResultsSummary';
import SearchPanel from '../components/SearchPanel';
import SidebarAds from '../components/SidebarAds';
import { searchPackages } from '../lib/api';
import type { PackageDeal, PackageSearchParams, PackageSearchResponse } from '../lib/types';

const DEFAULT_PARAMS: PackageSearchParams = {
  origin: 'LON',
  maxBudget: 1500,
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const controllerRef = useRef<AbortController | null>(null);

  const runSearch = async (searchParams: PackageSearchParams) => {
    setIsLoading(true);
    setError(null);
    if (controllerRef.current) controllerRef.current.abort();
    
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const response = await searchPackages(searchParams, controller.signal);
      setPackages(response.data);
      setSummary(response);
      if (response.data?.length > 0) setSelectedId(response.data[0].id);
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

  return (
    <main className="min-h-screen bg-gray-50/50 pb-20 pt-8">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        
        {/* Modern Header */}
        <header className="mb-12 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
              </span>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Live API Connection</p>
            </div>
            <h1 className="mt-2 font-display text-4xl font-bold text-gray-900 md:text-5xl">
              The Cheapest <span className="text-blue-600">Flights</span>
            </h1>
          </div>
         
        </header>

        <div className="grid gap-8 lg:grid-cols-[320px_1fr] xl:gap-12">
          
          {/* LEFT COLUMN: Search & Filters */}
          <aside className="space-y-8">
            <div className="sticky top-8 space-y-6">
              <div className="rounded-3xl bg-white p-6 shadow-xl shadow-gray-200/50">
                <h2 className="mb-4 text-xl font-bold text-gray-900">Plan your trip</h2>
                <SearchPanel
                  params={params}
                  onChange={setParams}
                  onSubmit={() => runSearch(params)}
                  isLoading={isLoading}
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                  ⚠️ {error}
                </div>
              )}

              <div className="hidden lg:block">
                 <SidebarAds position="left" />
              </div>
            </div>
          </aside>

          {/* RIGHT COLUMN: Results */}
          <section className="space-y-6">
            
            {/* Toolbar */}
            <div className="flex flex-col justify-between gap-4 rounded-2xl bg-white p-4 shadow-sm md:flex-row md:items-center">
                <ResultsSummary
                  count={packages.length}
                  params={summary?.searchParams || params}
                  disclaimer={summary?.disclaimer || ''}
                />
                
                <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
                    {['grid', 'list'].map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode as 'grid' | 'list')}
                            className={`rounded-md px-4 py-1.5 text-xs font-bold uppercase transition-all ${
                                viewMode === mode 
                                    ? 'bg-white text-gray-900 shadow-sm' 
                                    : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
            </div>

            {/* Fallback Warning */}
            {isFallback && !isLoading && (
                <div className="flex items-start gap-4 rounded-2xl border border-amber-100 bg-amber-50/50 p-6">
                    <span className="text-2xl">🤔</span>
                    <div>
                        <h3 className="font-bold text-amber-900">Strict budget? No problem.</h3>
                        <p className="text-sm text-amber-800/80">
                           We couldn't find matches under £{params.maxBudget}, so we found the absolute cheapest alternatives for you.
                        </p>
                    </div>
                </div>
            )}

            {/* SKELETON LOADING STATE */}
            {isLoading && (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                 {[1,2,3,4,5,6].map(i => (
                     <div key={i} className="flex h-[420px] flex-col overflow-hidden rounded-3xl bg-white shadow-sm">
                        <div className="h-48 w-full animate-pulse bg-gray-200" />
                        <div className="p-6 space-y-4">
                            <div className="h-6 w-3/4 animate-pulse rounded bg-gray-100" />
                            <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
                            <div className="pt-4 flex justify-between">
                                <div className="h-10 w-24 animate-pulse rounded-full bg-gray-100" />
                                <div className="h-10 w-24 animate-pulse rounded-full bg-gray-100" />
                            </div>
                        </div>
                     </div>
                 ))}
              </div>
            )}

            {/* LIVE RESULTS */}
            {!isLoading && packages.length > 0 && (
              <div className={
                  viewMode === 'grid' 
                    ? "grid gap-6 md:grid-cols-2 xl:grid-cols-3" 
                    : "flex flex-col gap-6 mx-auto max-w-4xl"
              }>
                {packages.map((deal) => (
                  <PackageCard
                    key={deal.id}
                    deal={deal}
                    isSelected={deal.id === selectedId}
                    onSelect={setSelectedId}
                  />
                ))}
              </div>
            )}

            {!isLoading && packages.length === 0 && !error && (
                <div className="flex h-96 flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-gray-50 text-center">
                    <div className="text-4xl">✈️</div>
                    <h3 className="mt-4 font-bold text-gray-900">No flights found</h3>
                    <p className="text-gray-500">Try changing your mood or increasing your budget.</p>
                </div>
            )}

          </section>
        </div>
      </div>
    </main>
  );
}