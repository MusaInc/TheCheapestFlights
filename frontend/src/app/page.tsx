'use client';

import { useState } from 'react';
import Link from 'next/link';
import AviasalesSearchWidget from '../components/AviasalesSearchWidget';
import AviasalesMapWidget from '../components/AviasalesMapWidget';
import KlookWidget from '../components/KlookWidget';
import TpWidget from '../components/TpWidget';

export default function HomePage() {
  const [searchMode, setSearchMode] = useState<'flights' | 'trains'>('flights');

  return (
    <main className="min-h-screen bg-[var(--sand)] pb-24">
      {/* Header */}
      <header className="border-b border-[var(--border-light)] bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-[1400px] px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left: Logo & Status */}
            <div className="flex items-center gap-3">
              <Link href="/" className="text-xl font-bold text-[var(--ink)]">
                CheapAsTrips
              </Link>
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[var(--success-soft)] px-2 py-0.5 text-xs font-medium text-[var(--success)]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--success)] opacity-75"></span>
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--success)]"></span>
                </span>
                Low Prices
              </span>
            </div>

            {/* Right: Navigation Links */}
            <div className="flex items-center gap-6">
                <Link 
                  href="/services" 
                  className="text-sm font-bold text-[var(--accent)] hover:text-[var(--ink)] transition-colors border-2 border-[var(--accent-soft)] rounded-lg px-3 py-1.5"
                >
                    Transfers & Extras
                </Link>
                <p className="text-sm text-[var(--ink-muted)] hidden md:block border-l pl-6 border-gray-200">
                  Flights, trains + hotels
                </p>
            </div>

          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-4 md:px-6 lg:px-8 pt-8">
        
        {/* Main Content Grid */}
        <div className="flex flex-col gap-10">

          {/* 1. HERO SECTION: Search Widget with Toggle */}
          <section className="mx-auto w-full max-w-4xl space-y-6 text-center">
            <h1 className="text-3xl font-bold text-[var(--ink)] md:text-5xl">
              Where will you go next?
            </h1>
            <p className="text-lg text-[var(--ink-muted)]">
              Search hundreds of airlines, trains, and travel sites at once.
            </p>
            
            {/* SEARCH MODE TOGGLE SLIDER */}
            <div className="flex justify-center mt-6">
                <div className="relative flex bg-gray-200 rounded-full p-1 cursor-pointer w-64 h-12 shadow-inner">
                    {/* Sliding Background */}
                    <div 
                        className={`absolute top-1 bottom-1 w-[48%] bg-white rounded-full shadow-sm transition-all duration-300 ease-in-out ${
                            searchMode === 'flights' ? 'left-1' : 'left-[50%]'
                        }`}
                    />
                    
                    {/* Flights Button */}
                    <button 
                        onClick={() => setSearchMode('flights')}
                        className={`relative z-10 w-1/2 text-sm font-bold transition-colors duration-200 flex items-center justify-center gap-2 ${
                            searchMode === 'flights' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <span>✈️</span> Flights
                    </button>
                    
                    {/* Trains Button */}
                    <button 
                        onClick={() => setSearchMode('trains')}
                        className={`relative z-10 w-1/2 text-sm font-bold transition-colors duration-200 flex items-center justify-center gap-2 ${
                            searchMode === 'trains' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <span>🚆</span> Transfers
                    </button>
                </div>
            </div>

            {/* CONDITIONAL WIDGET RENDER */}
            <div className="mt-6 text-left transition-opacity duration-300">
              {searchMode === 'flights' ? (
                  // FLIGHTS WIDGET (Aviasales)
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <AviasalesSearchWidget />
                  </div>
              ) : (
                  // TRAINS WIDGET (12Go)
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="bg-white rounded-2xl p-6 shadow-lg border border-[var(--border-light)]">
                          <h3 className="text-lg font-bold text-[var(--ink)] mb-4 flex items-center gap-2">
                              <span className="text-2xl">🚆</span> Search Trains, Buses & Ferries
                          </h3>
                          <TpWidget 
                              src="https://tpwdgt.com/content?currency=USD&trs=492052&shmarker=698242.HomeScreen-Map&language=en&theme=1&powered_by=true&campaign_id=1&promo_id=1486" 
                              height="220px"
                              className="border-0 shadow-none"
                          />
                      </div>
                  </div>
              )}
            </div>
          </section>

  {/* 3. MAP SECTION: Explore Widget */}
          <section className="space-y-6">
             <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[var(--ink)]">Explore the Map</h2>
                <span className="text-sm text-[var(--ink-muted)]">Drag to search new areas</span>
             </div>
             
             {/* Aviasales Map Widget */}
             <AviasalesMapWidget />
          </section>

          {/* 2. LOW FARE CALENDAR */}
          <section className="mx-auto w-full max-w-3xl space-y-4">
             <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                <span className="text-xl">📉</span>
                <h2 className="text-2xl font-bold text-[var(--ink)]">Cheapest Days to Fly</h2>
             </div>
             <p className="text-[var(--ink-muted)] text-center md:text-left mb-4">
               Flexible with your dates? Use the calendar below to find the best prices for upcoming flights.
             </p>
             <TpWidget 
                src="https://tpwdgt.com/content?currency=usd&trs=492052&shmarker=698242.HomeScreen-Map&target_host=www.aviasales.com%2Fsearch&locale=en&limit=6&powered_by=true&primary=%230085FF&promo_id=4044&campaign_id=100" 
                height="400px"
             />
          </section>

        
          {/* 4. EXTRAS: Klook Activities */}
          <section className="space-y-6">
             <h2 className="text-2xl font-bold text-[var(--ink)]">Trending Activities</h2>
             <KlookWidget />
          </section>

          {/* Footer */}
          <div className="pt-12 border-t border-[var(--border-light)] text-center space-y-4">
            <p className="disclaimer max-w-2xl mx-auto text-sm text-[var(--ink-muted)]">
              Prices shown are estimates based on recent searches and may change.
              Always verify final prices on booking sites before purchase.
              We may earn a commission from partner bookings.
            </p>
            <div className="flex justify-center gap-6 text-sm font-medium text-[var(--ink-muted)]">
                <Link href="/faq" className="hover:text-[var(--ink)] transition-colors">
                  Frequently Asked Questions
                </Link>
                <Link href="/privacy" className="hover:text-[var(--ink)] transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/services" className="hover:text-[var(--ink)] transition-colors">
                  Travel Services
                </Link>
            </div>
            <p className="text-xs text-[var(--ink-muted)] opacity-60">
              © 2026 CheapAsTrips. All rights reserved.
            </p>
          </div>

        </div>
      </div>
    </main>
  );
}