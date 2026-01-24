import { formatDateLong, formatMoney } from '../lib/format';
import type { PackageDeal } from '../lib/types';

const carrierNames: Record<string, string> = {
  BA: 'British Airways',
  FR: 'Ryanair',
  U2: 'easyJet',
  VY: 'Vueling',
  IB: 'Iberia',
  TP: 'TAP Portugal',
  KL: 'KLM',
  AF: 'Air France',
  LH: 'Lufthansa',
  eurostar: 'Eurostar',
  tgv: 'TGV',
  thalys: 'Thalys',
  ice: 'ICE',
  frecciarossa: 'Frecciarossa',
  italo: 'Italo',
  ave: 'AVE',
  renfe: 'Renfe',
  railjet: 'Railjet',
  ec: 'EuroCity',
};

function formatCarriers(codes: string[], isTrain: boolean = false) {
  if (!codes.length) return isTrain ? 'Train service' : 'Multiple airlines';
  const mapped = codes.map((code) => carrierNames[code] || carrierNames[code.toLowerCase()] || code);
  return mapped.slice(0, 2).join(', ');
}

type PackageCardProps = {
  deal: PackageDeal;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  layout?: 'grid' | 'list';
};

export default function PackageCard({
  deal,
  isSelected,
  isExpanded,
  onSelect,
  onToggle,
  layout = 'grid'
}: PackageCardProps) {
  const isTrain = deal.transportType === 'train';
  const carriers = deal.transport?.carriers || deal.flight.airlines || [];
  const transportPrice = deal.transport?.price || deal.flight.price;
  const hasAddons = deal.addons?.available && deal.addons.mainLink;
  const detailsId = `${deal.id}-details`;
  const optionImage = deal.hotelOptions?.find((option) => Boolean(option.image))?.image || '';
  const imageSrc = deal.hotel.image || optionImage;
  const transportLink = deal.transport?.bookingLink || null;
  const hasHotelOptions = Boolean(deal.hotelOptions && deal.hotelOptions.length > 0);
  const restaurants = deal.addons?.restaurants || [];
  const isList = layout === 'list';

  const stopsText = isTrain
    ? (deal.transport?.isDirect ? 'Direct' : `${deal.flight.outboundStops} change${deal.flight.outboundStops !== 1 ? 's' : ''}`)
    : (deal.flight.outboundStops === 0 ? 'Direct' : `${deal.flight.outboundStops} stop${deal.flight.outboundStops !== 1 ? 's' : ''}`);

  return (
    <article
      className={`group relative rounded-2xl bg-white border transition-all duration-200 overflow-hidden ${
        isSelected
          ? 'border-[var(--accent)] ring-1 ring-[var(--accent-soft)] shadow-[var(--shadow-md)]'
          : 'border-[var(--border-light)] hover:border-[var(--border)] hover:shadow-[var(--shadow-md)]'
      } ${isList ? 'flex flex-col md:flex-row' : 'flex flex-col'}`}
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
      aria-controls={detailsId}
      onMouseEnter={() => onSelect(deal.id)}
      onFocus={() => onSelect(deal.id)}
      onClick={() => onToggle(deal.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onToggle(deal.id);
        }
      }}
    >
      {/* Image Section */}
      <div className={`relative ${isList ? 'h-48 md:h-auto md:w-2/5' : 'h-44'} bg-[var(--border-light)]`}>
        {imageSrc ? (
          <a
            href={deal.hotel.bookingLink}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="block h-full w-full"
            aria-label={`View ${deal.hotel.name} on Booking.com`}
          >
            <img
              src={imageSrc}
              alt={`${deal.hotel.name} in ${deal.city}`}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          </a>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[var(--ink-faint)]">
            <svg className="w-10 h-10 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          {deal.hotel.rating > 0 && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-white/95 px-2 py-1 text-xs font-medium text-[var(--ink)] shadow-sm backdrop-blur-sm">
              <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {deal.hotel.rating}
            </span>
          )}
          <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium shadow-sm backdrop-blur-sm ${
            isTrain
              ? 'bg-[var(--success-soft)] text-[var(--success)]'
              : 'bg-[var(--accent-soft)] text-[var(--accent)]'
          }`}>
            {isTrain ? '🚄' : '✈️'} {isTrain ? 'Train' : 'Flight'}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className={`flex flex-1 flex-col p-4 ${isList ? 'md:p-5' : ''}`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-[var(--ink-muted)]">
              {deal.city}, {deal.country}
            </p>
            <h3 className="mt-0.5 font-semibold text-[var(--ink)] truncate" title={deal.hotel.name}>
              {deal.hotel.name}
            </h3>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-[var(--ink-muted)]">From</p>
            <p className="text-xl font-bold text-[var(--ink)]">
              {formatMoney(deal.totalPrice, deal.currency)}
            </p>
          </div>
        </div>

        {/* Trip Details */}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--ink-muted)]">
          <span>{deal.nights} nights</span>
          <span className="text-[var(--border)]">•</span>
          <span>{deal.adults} {deal.adults === 1 ? 'adult' : 'adults'}</span>
          <span className="text-[var(--border)]">•</span>
          <span>{stopsText}</span>
        </div>

        {/* Transport Info */}
        <div className={`mt-3 rounded-xl p-3 ${isTrain ? 'bg-[var(--success-soft)]/30' : 'bg-[var(--border-light)]'}`}>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--ink-muted)]">
              {formatDateLong(deal.flight.outboundDate)}
            </span>
            <span className="font-medium text-[var(--ink)]">
              {formatCarriers(carriers, isTrain)}
            </span>
          </div>
          {isTrain && deal.transport?.duration && (
            <p className="mt-1.5 text-xs text-[var(--success)]">
              {deal.transport.duration.outbound} journey
            </p>
          )}
        </div>

        {/* Price Breakdown */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-[var(--border-light)] p-2.5 text-center">
            <p className="text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">
              {isTrain ? 'Train' : 'Flights'}
            </p>
            <p className="mt-0.5 font-semibold text-[var(--ink)]">
              {formatMoney(transportPrice, deal.currency)}
            </p>
          </div>
          <div className="rounded-lg bg-[var(--border-light)] p-2.5 text-center">
            <p className="text-[10px] uppercase tracking-wide text-[var(--ink-muted)]">Hotel</p>
            <p className="mt-0.5 font-semibold text-[var(--ink)]">
              {formatMoney(deal.priceBreakdown.hotel, deal.currency)}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          {transportLink && (
            <a
              href={transportLink}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                isTrain
                  ? 'bg-[var(--success-soft)] text-[var(--success)] hover:bg-[#a7f3d0]'
                  : 'bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-[#bfdbfe]'
              }`}
            >
              Check {isTrain ? 'train' : 'flight'}
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
          <a
            href={deal.hotel.bookingLink}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--ink)] px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-[#374151]"
          >
            View hotel
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        {/* Expand Hint */}
        <button
          type="button"
          className="mt-3 flex items-center justify-center gap-1.5 text-xs text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(deal.id);
          }}
        >
          {isExpanded ? 'Hide options' : 'More options'}
          <svg
            className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Expanded Content */}
        <div
          id={detailsId}
          className={`overflow-hidden transition-all duration-300 ${
            isExpanded ? 'mt-4 max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
          }`}
          aria-hidden={!isExpanded}
        >
          <div className="space-y-4 border-t border-[var(--border-light)] pt-4">

            {/* Alternative Hotels */}
            {hasHotelOptions && (
              <div>
                <h4 className="text-xs font-medium text-[var(--ink-muted)] uppercase tracking-wide mb-2">
                  Other hotels in {deal.city}
                </h4>
                <div className="space-y-2">
                  {deal.hotelOptions!.slice(0, 3).map((hotel) => (
                    <a
                      key={hotel.id}
                      href={hotel.bookingLink}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-3 rounded-xl border border-[var(--border-light)] bg-white p-3 transition-all hover:border-[var(--border)] hover:shadow-sm"
                    >
                      {hotel.image ? (
                        <img
                          src={hotel.image}
                          alt={hotel.name}
                          className="h-12 w-16 rounded-lg object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-12 w-16 items-center justify-center rounded-lg bg-[var(--border-light)]">
                          <svg className="w-5 h-5 text-[var(--ink-faint)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--ink)] truncate">{hotel.name}</p>
                        {hotel.rating > 0 && (
                          <p className="text-xs text-[var(--ink-muted)]">
                            <span className="text-amber-500">★</span> {hotel.rating}
                          </p>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-[var(--ink)]">
                        {formatMoney(hotel.price, deal.currency)}
                      </p>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Add-ons */}
            {hasAddons && deal.addons?.highlights && deal.addons.highlights.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-[var(--ink-muted)] uppercase tracking-wide mb-2">
                  Things to do
                </h4>
                <div className="space-y-2">
                  {deal.addons.highlights.slice(0, 3).map((item, index) => (
                    <a
                      key={`${item.name}-${index}`}
                      href={item.bookingLink}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-between rounded-xl bg-[var(--warning-soft)]/30 px-3 py-2.5 text-sm transition-colors hover:bg-[var(--warning-soft)]/50"
                    >
                      <span className="text-[var(--ink)]">{item.name}</span>
                      <span className="text-xs text-[var(--ink-muted)]">
                        From {formatMoney(item.priceFrom, deal.currency)}
                      </span>
                    </a>
                  ))}
                </div>
                {deal.addons.mainLink && (
                  <a
                    href={deal.addons.mainLink}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline"
                  >
                    See all activities
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                )}
              </div>
            )}

            {/* Restaurants */}
            {restaurants.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-[var(--ink-muted)] uppercase tracking-wide mb-2">
                  Recommended restaurants
                </h4>
                <div className="space-y-2">
                  {restaurants.slice(0, 2).map((restaurant) => (
                    <div
                      key={restaurant.id}
                      className="flex items-center gap-3 rounded-xl border border-[var(--border-light)] bg-white p-3"
                    >
                      {restaurant.image ? (
                        <img
                          src={restaurant.image}
                          alt={restaurant.name}
                          className="h-10 w-14 rounded-lg object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-10 w-14 items-center justify-center rounded-lg bg-[var(--border-light)] text-lg">
                          🍽️
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--ink)] truncate">{restaurant.name}</p>
                        <p className="text-xs text-[var(--ink-muted)]">
                          {restaurant.priceLevel || 'Popular spot'}
                          {restaurant.rating && ` · ★ ${restaurant.rating.toFixed(1)}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <p className="text-[10px] text-[var(--ink-faint)] leading-relaxed">
              Prices are estimates and may vary. Check live availability on partner sites.
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
