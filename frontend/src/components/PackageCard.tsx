import { formatDateLong, formatMoney } from '../lib/format';
import type { PackageDeal } from '../lib/types';

const airlineNames: Record<string, string> = {
  BA: 'British Airways',
  FR: 'Ryanair',
  U2: 'easyJet',
  VY: 'Vueling',
  IB: 'Iberia',
  TP: 'TAP Air Portugal',
  KL: 'KLM',
  AF: 'Air France',
  LH: 'Lufthansa'
};

function formatAirlines(codes: string[]) {
  if (!codes.length) return 'Multiple airlines';
  const mapped = codes.map((code) => airlineNames[code] || code);
  return mapped.join(', ');
}

type PackageCardProps = {
  deal: PackageDeal;
  isSelected: boolean;
  onSelect: (id: string) => void;
};

export default function PackageCard({ deal, isSelected, onSelect }: PackageCardProps) {
  return (
    <article
      className={`rounded-2xl border p-5 transition ${
        isSelected
          ? 'border-ink/30 bg-white shadow-soft'
          : 'border-clay/40 bg-white/80 hover:border-ink/30'
      }`}
      onMouseEnter={() => onSelect(deal.id)}
      onFocus={() => onSelect(deal.id)}
      tabIndex={0}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-ink/60">{deal.country}</p>
          <h3 className="font-display text-2xl text-ink">{deal.city}</h3>
          <p className="mt-1 text-sm text-ink/60">
            {deal.nights} nights | {deal.adults} adult{deal.adults === 1 ? '' : 's'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.2em] text-ink/60">Total</p>
          <p className="text-2xl font-semibold text-ink">
            {formatMoney(deal.totalPrice, deal.currency)}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-haze/70 p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-ink/60">Flight dates</span>
          <span className="font-medium text-ink">
            {formatDateLong(deal.flight.outboundDate)} to {formatDateLong(deal.flight.returnDate)}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-ink/60">
          <span>{formatAirlines(deal.flight.airlines)}</span>
          <span>{deal.flight.outboundStops} stop(s) out / {deal.flight.inboundStops} back</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl border border-clay/40 bg-white p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-ink/50">Flights</p>
          <p className="mt-1 text-lg font-semibold text-ink">
            {formatMoney(deal.priceBreakdown.flight, deal.flight.currency)}
          </p>
        </div>
        <div className="rounded-xl border border-clay/40 bg-white p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-ink/50">Hotels est.</p>
          <p className="mt-1 text-lg font-semibold text-ink">
            {formatMoney(deal.priceBreakdown.hotelEstimate, deal.currency)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-ink/50">Prices via Amadeus. Hotels via Booking.com.</p>
        <a
          href={deal.hotel.searchUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-ink/30 px-4 py-2 text-xs font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-ink hover:text-white"
        >
          View hotels
        </a>
      </div>
    </article>
  );
}
