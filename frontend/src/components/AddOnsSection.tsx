'use client';

import type { AddonCategory, PackageAddons } from '../lib/types';
import { formatMoney } from '../lib/format';

// Default Klook affiliate link
const KLOOK_AFFILIATE_LINK = 'https://klook.tpx.lu/89cfHZHx';

// Category icons for rendering
const categoryIcons: Record<string, string> = {
  tours: '🎭',
  activities: '🎿',
  insurance: '🛡️',
  carRental: '🚗',
  bikeRental: '🚲',
  transfers: '🚐',
  trains: '🚄',
  buses: '🚌',
  wifi: '📱',
  attractions: '🎟️',
};

interface AddOnsSectionProps {
  city: string;
  addons?: PackageAddons;
  nights?: number;
  adults?: number;
}

export default function AddOnsSection({ city, addons, nights = 4, adults = 2 }: AddOnsSectionProps) {
  const mainLink = addons?.mainLink || KLOOK_AFFILIATE_LINK;
  const categories = addons?.categories || [];
  const insurance = addons?.insurance;
  const transfers = addons?.transfers;

  if (!addons?.available && !city) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-900">Enhance Your Trip</h3>
          <p className="text-xs text-gray-500">Tours, activities, insurance & more for {city}</p>
        </div>
        <a
          href={mainLink}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-bold text-amber-700 hover:text-amber-800 underline"
        >
          View All
        </a>
      </div>

      {/* Quick Category Links */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
        {(categories.length > 0 ? categories.slice(0, 5) : defaultCategories).map((cat) => (
          <a
            key={cat.id}
            href={cat.link || mainLink}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center gap-1 rounded-xl bg-white p-3 text-center transition hover:shadow-md hover:-translate-y-0.5"
          >
            <span className="text-2xl">{categoryIcons[cat.id] || cat.icon}</span>
            <span className="text-[10px] font-medium text-gray-700 leading-tight">{cat.name}</span>
          </a>
        ))}
      </div>

      {/* Recommended Add-ons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Insurance Card */}
        {insurance && (
          <a
            href={insurance.bookingLink || mainLink}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-xl bg-white p-3 transition hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-xl">
              🛡️
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-900">{insurance.name}</p>
              <p className="text-[10px] text-gray-500">{insurance.description}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-blue-600">
                {formatMoney(insurance.price, 'GBP')}
              </p>
              <p className="text-[10px] text-gray-400">total</p>
            </div>
          </a>
        )}

        {/* Transfers Card */}
        {transfers && (
          <a
            href={transfers.bookingLink || mainLink}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-xl bg-white p-3 transition hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-xl">
              {transfers.icon || '🚐'}
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-900">{transfers.name}</p>
              <p className="text-[10px] text-gray-500">{transfers.description}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-green-600">
                {formatMoney(transfers.price, 'GBP')}
              </p>
              <p className="text-[10px] text-gray-400">per way</p>
            </div>
          </a>
        )}
      </div>

      {/* CTA */}
      <a
        href={mainLink}
        target="_blank"
        rel="noreferrer"
        className="mt-4 block w-full rounded-xl bg-amber-500 py-3 text-center text-sm font-bold text-white transition hover:bg-amber-600"
      >
        Explore All Add-ons for {city}
      </a>
    </div>
  );
}

// Default categories when API data is not available
const defaultCategories: AddonCategory[] = [
  {
    id: 'tours',
    name: 'Tours',
    icon: '🎭',
    description: 'Day trips and guided tours',
    link: KLOOK_AFFILIATE_LINK,
    available: true,
    popular: true,
  },
  {
    id: 'attractions',
    name: 'Attractions',
    icon: '🎟️',
    description: 'Skip-the-line tickets',
    link: KLOOK_AFFILIATE_LINK,
    available: true,
    popular: true,
  },
  {
    id: 'insurance',
    name: 'Insurance',
    icon: '🛡️',
    description: 'Travel protection',
    link: KLOOK_AFFILIATE_LINK,
    available: true,
    popular: true,
  },
  {
    id: 'carRental',
    name: 'Car Rental',
    icon: '🚗',
    description: 'Rent a car',
    link: KLOOK_AFFILIATE_LINK,
    available: true,
    popular: true,
  },
  {
    id: 'transfers',
    name: 'Transfers',
    icon: '🚐',
    description: 'Airport transfers',
    link: KLOOK_AFFILIATE_LINK,
    available: true,
    popular: true,
  },
];

// Compact version for embedding in cards
export function AddOnsCompact({ city, mainLink }: { city: string; mainLink?: string }) {
  const link = mainLink || KLOOK_AFFILIATE_LINK;

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-500">Add:</span>
      <a
        href={`${link}?cat=tours`}
        target="_blank"
        rel="noreferrer"
        className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600 hover:bg-gray-200"
      >
        🎭 Tours
      </a>
      <a
        href={`${link}?cat=insurance`}
        target="_blank"
        rel="noreferrer"
        className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600 hover:bg-gray-200"
      >
        🛡️ Insurance
      </a>
      <a
        href={`${link}?cat=carRental`}
        target="_blank"
        rel="noreferrer"
        className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600 hover:bg-gray-200"
      >
        🚗 Car
      </a>
    </div>
  );
}
