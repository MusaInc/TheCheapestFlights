import type { PackageSearchParams } from '../lib/types';

const ORIGINS = [
  { value: 'LON', label: 'London (LON)' },
  { value: 'MAN', label: 'Manchester (MAN)' },
  { value: 'BHX', label: 'Birmingham (BHX)' },
  { value: 'EDI', label: 'Edinburgh (EDI)' },
  { value: 'DUB', label: 'Dublin (DUB)' }
];

const MOODS: Array<{ value: PackageSearchParams['mood']; label: string }> = [
  { value: 'random', label: 'Surprise me' },
  { value: 'sun', label: 'Sun & sea' },
  { value: 'city', label: 'City break' }
];

type SearchPanelProps = {
  params: PackageSearchParams;
  onChange: (next: PackageSearchParams) => void;
  onSubmit: () => void;
  isLoading: boolean;
};

export default function SearchPanel({ params, onChange, onSubmit, isLoading }: SearchPanelProps) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="rounded-3xl border border-clay/50 bg-paper/95 p-6 shadow-soft backdrop-blur"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-ink/60">Search</p>
          <h2 className="font-display text-2xl text-ink">Find the cheapest trip</h2>
          <p className="mt-2 text-sm text-ink/60">
            Set your budget. We scan multiple weeks automatically.
          </p>
        </div>
        <button
          type="submit"
          className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-accent/90"
          disabled={isLoading}
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-ink/60">Departure</span>
          <select
            value={params.origin}
            onChange={(event) => onChange({ ...params, origin: event.target.value })}
            className="rounded-xl border border-clay/50 bg-white px-3 py-2 text-sm"
          >
            {ORIGINS.map((origin) => (
              <option key={origin.value} value={origin.value}>
                {origin.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-ink/60">Total budget (GBP)</span>
          <input
            type="number"
            min={200}
            max={2000}
            step={50}
            value={params.maxBudget}
            onChange={(event) =>
              onChange({ ...params, maxBudget: Number(event.target.value) || 0 })
            }
            className="rounded-xl border border-clay/50 bg-white px-3 py-2 text-sm"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-ink/60">Trip length</span>
          <select
            value={params.nights}
            onChange={(event) => onChange({ ...params, nights: Number(event.target.value) })}
            className="rounded-xl border border-clay/50 bg-white px-3 py-2 text-sm"
          >
            {[3, 4, 5, 6, 7].map((nights) => (
              <option key={nights} value={nights}>
                {nights} nights
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-ink/60">Mood</span>
          <select
            value={params.mood}
            onChange={(event) => onChange({ ...params, mood: event.target.value as PackageSearchParams['mood'] })}
            className="rounded-xl border border-clay/50 bg-white px-3 py-2 text-sm"
          >
            {MOODS.map((mood) => (
              <option key={mood.value} value={mood.value}>
                {mood.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-ink/60">Adults</span>
          <select
            value={params.adults}
            onChange={(event) => onChange({ ...params, adults: Number(event.target.value) })}
            className="rounded-xl border border-clay/50 bg-white px-3 py-2 text-sm"
          >
            {[1, 2, 3, 4].map((adults) => (
              <option key={adults} value={adults}>
                {adults} adult{adults === 1 ? '' : 's'}
              </option>
            ))}
          </select>
        </label>
      </div>
    </form>
  );
}
