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
      className={`group relative overflow-hidden rounded-3xl border transition-all duration-300 ${
        isSelected
          ? 'border-clay bg-white ring-1 ring-clay shadow-soft'
          : 'border-clay/40 bg-white/80 hover:border-clay/60 hover:bg-white'
      }`}
      onMouseEnter={() => onSelect(deal.id)}
      onFocus={() => onSelect(deal.id)}
      tabIndex={0}
    >
      <div className="flex flex-col md:flex-row">
        {/* NEW: Hotel Image Section */}
        <div className="relative h-48 w-full md:h-auto md:w-1/3 overflow-hidden">
          {deal.hotel.image ? (
            <img 
              src={deal.hotel.image} 
              alt={deal.hotel.name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" 
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-clay/10 text-ink/40">
              <span className="text-xs uppercase tracking-wider">No Image</span>
            </div>
          )}
          
          {/* Rating Badge */}
          {deal.hotel.rating > 0 && (
            <div className="absolute top-3 left-3 rounded-full bg-white/90 px-2 py-1 text-xs font-bold text-ink shadow-sm backdrop-blur-sm">
              ⭐ {deal.hotel.rating}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex flex-1 flex-col justify-between p-5">
          
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ink/60">
                {deal.city}, {deal.country}
              </p>
              <h3 className="font-display text-xl text-ink line-clamp-1" title={deal.hotel.name}>
                {deal.hotel.name}
              </h3>
              <p className="mt-1 text-xs text-ink/60">
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

          {/* Flight Info Box */}
          <div className="mt-4 rounded-xl bg-haze/70 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-ink/60">Flight dates</span>
              <span className="font-medium text-ink text-xs">
                {formatDateLong(deal.flight.outboundDate)} - {formatDateLong(deal.flight.returnDate)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-ink/60 uppercase tracking-wide">
              <span>{formatAirlines(deal.flight.airlines)}</span>
              <span>
                {deal.flight.outboundStops === 0 ? 'Direct' : `${deal.flight.outboundStops} stop`}
              </span>
            </div>
          </div>

          {/* Price Breakdown Grid */}
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-clay/40 bg-white p-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-ink/50">Flights</p>
              <p className="mt-1 text-lg font-semibold text-ink">
                {formatMoney(deal.priceBreakdown.flight, deal.flight.currency)}
              </p>
            </div>
            <div className="rounded-xl border border-clay/40 bg-white p-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-ink/50">Hotel</p>
              <p className="mt-1 text-lg font-semibold text-ink">
                {/* FIXED: Using real hotel price instead of estimate */}
                {formatMoney(deal.priceBreakdown.hotel, deal.currency)}
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[10px] text-ink/40">Includes taxes & fees</p>
            <a
              href={deal.hotel.bookingLink}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()} // Stop card selection when clicking button
              className="rounded-full bg-ink px-6 py-2 text-xs font-bold text-white transition hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
            >
              View Hotel ↗
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}