'use client';

import { useEffect, useState } from 'react';
import type { PackageSearchParams } from '../lib/types';

interface SearchPanelProps {
  params: PackageSearchParams;
  onChange: (params: PackageSearchParams) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

const TRANSPORT_OPTIONS = [
  { value: 'any', label: 'Any', description: 'Best price' },
  { value: 'flight', label: 'Flight', description: 'Fastest' },
  { value: 'train', label: 'Train', description: 'Eco-friendly' },
] as const;

const MOOD_OPTIONS = [
  { value: 'random', label: 'All', icon: '🌍' },
  { value: 'sun', label: 'Beach', icon: '🏖️' },
  { value: 'city', label: 'City', icon: '🏙️' },
  { value: 'romantic', label: 'Romantic', icon: '💕' },
  { value: 'adventure', label: 'Adventure', icon: '🏔️' },
  { value: 'chill', label: 'Chill', icon: '🧘' },
] as const;

const ORIGIN_SUGGESTIONS = [
  { code: 'LON', name: 'London' },
  { code: 'MAN', name: 'Manchester' },
  { code: 'BHX', name: 'Birmingham' },
  { code: 'EDI', name: 'Edinburgh' },
  { code: 'DUB', name: 'Dublin' },
];

export default function SearchPanel({ params, onChange, onSubmit, isLoading }: SearchPanelProps) {
  const [localBudget, setLocalBudget] = useState(params.maxBudget);
  const normalizedOrigin = params.origin.trim().toUpperCase();
  const matchedOrigin = ORIGIN_SUGGESTIONS.find(
    (item) => item.code === normalizedOrigin || item.name.toUpperCase() === normalizedOrigin
  );
  const [originMode, setOriginMode] = useState<'preset' | 'custom'>(matchedOrigin ? 'preset' : 'custom');
  const [customOrigin, setCustomOrigin] = useState(matchedOrigin ? '' : params.origin);

  useEffect(() => {
    setLocalBudget(params.maxBudget);
  }, [params.maxBudget]);

  useEffect(() => {
    const isPreset = Boolean(matchedOrigin);
    setOriginMode(isPreset ? 'preset' : 'custom');
    if (!isPreset) {
      setCustomOrigin(params.origin);
    }
  }, [params.origin, matchedOrigin]);

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setLocalBudget(val);
    onChange({ ...params, maxBudget: val });
  };

  const currentTransport = params.transportType || 'any';
  const isTrainOnly = currentTransport === 'train';
  const showTrainWarning = isTrainOnly && !['LON', 'LONDON'].includes(normalizedOrigin);
  const originSelectValue = originMode === 'custom' ? 'CUSTOM' : (matchedOrigin?.code || 'LON');

  const handleTransportChange = (value: typeof currentTransport) => {
    if (value === 'train' && !['LON', 'LONDON'].includes(normalizedOrigin)) {
      setOriginMode('preset');
      setCustomOrigin('');
      onChange({ ...params, transportType: value, origin: 'LON' });
      return;
    }
    onChange({ ...params, transportType: value });
  };

  const handleOriginSelect = (value: string) => {
    if (value === 'CUSTOM') {
      setOriginMode('custom');
      onChange({ ...params, origin: customOrigin });
      return;
    }
    setOriginMode('preset');
    onChange({ ...params, origin: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

      {/* Transport Type */}
      <fieldset className="space-y-2">
        <legend className="text-xs font-medium text-[var(--ink-muted)] uppercase tracking-wide">
          Travel by
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {TRANSPORT_OPTIONS.map((opt) => {
            const isActive = currentTransport === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleTransportChange(opt.value)}
                className={`relative rounded-xl px-3 py-3 text-center transition-all ${
                  isActive
                    ? 'bg-[var(--ink)] text-white'
                    : 'bg-[var(--border-light)] text-[var(--ink)] hover:bg-[var(--border)]'
                }`}
              >
                <span className="block text-sm font-semibold">{opt.label}</span>
                <span className={`block text-[10px] mt-0.5 ${isActive ? 'text-white/70' : 'text-[var(--ink-muted)]'}`}>
                  {opt.description}
                </span>
              </button>
            );
          })}
        </div>
        {currentTransport === 'train' && (
          <p className="flex items-center gap-1.5 text-xs text-[var(--success)]">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            90% less CO2 than flying
          </p>
        )}
      </fieldset>

      {/* Origin */}
      <div className="space-y-2">
        <label htmlFor="origin" className="text-xs font-medium text-[var(--ink-muted)] uppercase tracking-wide">
          Flying from
        </label>
        <div className="space-y-2">
          <div className="relative">
            <select
              id="origin"
              value={originSelectValue}
              onChange={(e) => handleOriginSelect(e.target.value)}
              className="w-full appearance-none rounded-xl border border-[var(--border)] bg-white py-3 pl-4 pr-10 text-[var(--ink)] font-medium focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] transition-colors"
            >
              {ORIGIN_SUGGESTIONS.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name} ({item.code})
                </option>
              ))}
              <option value="CUSTOM">Other city / airport</option>
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-muted)] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          {originMode === 'custom' && (
            <input
              type="text"
              value={customOrigin}
              onChange={(e) => {
                setCustomOrigin(e.target.value);
                onChange({ ...params, origin: e.target.value });
              }}
              className="w-full rounded-xl border border-[var(--border)] bg-white py-3 px-4 text-[var(--ink)] font-medium placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] transition-colors"
              placeholder="Type city or IATA (e.g. LON)"
              autoComplete="off"
            />
          )}
        </div>
        {showTrainWarning && (
          <p className="flex items-center gap-1.5 text-xs text-[var(--warning)]">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Train routes only from London
          </p>
        )}
      </div>

      {/* Trip Vibe */}
      <fieldset className="space-y-2">
        <legend className="text-xs font-medium text-[var(--ink-muted)] uppercase tracking-wide">
          Trip vibe
        </legend>
        <div className="grid grid-cols-3 gap-1.5">
          {MOOD_OPTIONS.map((m) => {
            const isActive = params.mood === m.value;
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => onChange({ ...params, mood: m.value as any })}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 px-2 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--border-light)] text-[var(--ink)] hover:bg-[var(--border)]'
                }`}
              >
                <span>{m.icon}</span>
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Travelers & Nights */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label htmlFor="adults" className="text-xs font-medium text-[var(--ink-muted)] uppercase tracking-wide">
            Adults
          </label>
          <div className="relative">
            <select
              id="adults"
              value={params.adults}
              onChange={(e) => onChange({ ...params, adults: Number(e.target.value) })}
              className="w-full appearance-none rounded-xl border border-[var(--border)] bg-white py-3 pl-4 pr-10 text-[var(--ink)] font-medium focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] transition-colors"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-muted)] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="nights" className="text-xs font-medium text-[var(--ink-muted)] uppercase tracking-wide">
            Nights
          </label>
          <div className="relative">
            <select
              id="nights"
              value={params.nights}
              onChange={(e) => onChange({ ...params, nights: Number(e.target.value) })}
              className="w-full appearance-none rounded-xl border border-[var(--border)] bg-white py-3 pl-4 pr-10 text-[var(--ink)] font-medium focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] transition-colors"
            >
              {[2, 3, 4, 5, 6, 7, 10, 14].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-muted)] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Budget */}
      <div className="space-y-3 rounded-xl bg-[var(--cream)] p-4">
        <div className="flex items-center justify-between">
          <label htmlFor="budget" className="text-xs font-medium text-[var(--ink-muted)] uppercase tracking-wide">
            Max budget
          </label>
          <span className="text-lg font-bold text-[var(--ink)]">£{localBudget.toLocaleString()}</span>
        </div>
        <input
          id="budget"
          type="range"
          min={200}
          max={5000}
          step={50}
          value={localBudget}
          onChange={handleBudgetChange}
          className="w-full h-2 cursor-pointer appearance-none rounded-full bg-[var(--border)] accent-[var(--accent)]"
        />
        <div className="flex justify-between text-[10px] text-[var(--ink-faint)]">
          <span>£200</span>
          <span>Total per person</span>
          <span>£5,000</span>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl bg-[var(--accent)] py-3.5 text-sm font-semibold text-white transition-all hover:bg-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Searching...
          </span>
        ) : (
          'Search deals'
        )}
      </button>
    </form>
  );
}
