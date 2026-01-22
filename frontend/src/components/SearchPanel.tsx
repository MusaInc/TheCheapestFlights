'use client';

import { useState } from 'react';
import type { PackageSearchParams } from '../lib/types';

interface SearchPanelProps {
  params: PackageSearchParams;
  onChange: (params: PackageSearchParams) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export default function SearchPanel({ params, onChange, onSubmit, isLoading }: SearchPanelProps) {
  const [localBudget, setLocalBudget] = useState(params.maxBudget);

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setLocalBudget(val);
  };

  const handleBudgetCommit = () => {
    onChange({ ...params, maxBudget: localBudget });
  };

  return (
    <div className="flex flex-col gap-5">
      
      {/* Origin Input */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
          Flying From
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">🛫</span>
          <input
            type="text"
            value={params.origin}
            onChange={(e) => onChange({ ...params, origin: e.target.value.toUpperCase() })}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 font-bold text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="LON"
            maxLength={3}
          />
        </div>
      </div>

      {/* Mood Selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
          Trip Vibe
        </label>
        <div className="grid grid-cols-2 gap-2">
          {['random', 'romantic', 'city', 'chill'].map((m) => (
            <button
              key={m}
              onClick={() => onChange({ ...params, mood: m as any })}
              className={`rounded-lg py-2 text-xs font-bold capitalize transition-all ${
                params.mood === m
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Travelers & Nights (Row) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Adults
          </label>
          <input
            type="number"
            min={1}
            max={9}
            value={params.adults}
            onChange={(e) => onChange({ ...params, adults: Number(e.target.value) })}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 font-bold text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none"
          />
        </div>
        <div className="space-y-1.5">
           <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Nights
          </label>
          <input
            type="number"
            min={1}
            max={28}
            value={params.nights}
            onChange={(e) => onChange({ ...params, nights: Number(e.target.value) })}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 font-bold text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Budget Slider */}
      <div className="space-y-3 rounded-xl bg-blue-50 p-4">
        <div className="flex justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-blue-800">
            Max Budget
          </label>
          <span className="font-bold text-blue-700">£{localBudget}</span>
        </div>
        <input
          type="range"
          min={200}
          max={5000}
          step={50}
          value={localBudget}
          onChange={handleBudgetChange}
          onMouseUp={handleBudgetCommit}
          onTouchEnd={handleBudgetCommit}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-blue-200 accent-blue-600"
        />
        <div className="flex justify-between text-[10px] text-blue-400">
          <span>£200</span>
          <span>£5k+</span>
        </div>
      </div>

      {/* Search Button */}
      <button
        onClick={onSubmit}
        disabled={isLoading}
        className="mt-2 w-full rounded-xl bg-gray-900 py-4 font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-70"
      >
        {isLoading ? 'Searching...' : 'Find Cheapest Trip 🔎'}
      </button>
    </div>
  );
}