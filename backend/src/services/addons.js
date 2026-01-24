/**
 * Add-ons Service
 *
 * Integrates with Klook for travel add-ons:
 * - Tours & Activities
 * - Travel Insurance
 * - Car & Bike Rentals
 * - Airport Transfers
 * - Train & Bus tickets
 *
 * All links use the Klook affiliate program for commission.
 */

const NodeCache = require('node-cache');

// Cache add-on results for 1 hour
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

// Klook affiliate base URL (provided by user)
const KLOOK_AFFILIATE_BASE = process.env.KLOOK_AFFILIATE_URL || 'https://klook.tpx.lu/89cfHZHx';

// Klook city/destination IDs (for deep linking)
const KLOOK_CITY_IDS = {
  'Paris': { id: '1', slug: 'paris' },
  'London': { id: '2', slug: 'london' },
  'Barcelona': { id: '3', slug: 'barcelona' },
  'Rome': { id: '4', slug: 'rome' },
  'Amsterdam': { id: '5', slug: 'amsterdam' },
  'Berlin': { id: '6', slug: 'berlin' },
  'Prague': { id: '7', slug: 'prague' },
  'Vienna': { id: '8', slug: 'vienna' },
  'Budapest': { id: '9', slug: 'budapest' },
  'Lisbon': { id: '10', slug: 'lisbon' },
  'Madrid': { id: '11', slug: 'madrid' },
  'Milan': { id: '12', slug: 'milan' },
  'Venice': { id: '13', slug: 'venice' },
  'Brussels': { id: '14', slug: 'brussels' },
  'Munich': { id: '15', slug: 'munich' },
  'Nice': { id: '16', slug: 'nice' },
  'Athens': { id: '17', slug: 'athens' },
  'Dubrovnik': { id: '18', slug: 'dubrovnik' },
  'Copenhagen': { id: '19', slug: 'copenhagen' },
  'Stockholm': { id: '20', slug: 'stockholm' },
  'Krakow': { id: '21', slug: 'krakow' },
  'Naples': { id: '22', slug: 'naples' },
  'Porto': { id: '23', slug: 'porto' },
  'Split': { id: '24', slug: 'split' },
  'Malaga': { id: '25', slug: 'malaga' },
  'Seville': { id: '26', slug: 'seville' },
  'Valencia': { id: '27', slug: 'valencia' },
  'Lyon': { id: '28', slug: 'lyon' },
  'Palma': { id: '29', slug: 'mallorca' },
  'Tenerife': { id: '30', slug: 'tenerife' },
  'Alicante': { id: '31', slug: 'alicante' },
  'Faro': { id: '32', slug: 'faro' },
};

// Add-on categories with Klook URL patterns
const ADDON_CATEGORIES = {
  tours: {
    name: 'Tours & Activities',
    icon: '🎭',
    description: 'Day trips, guided tours, attractions & experiences',
    urlSuffix: '/things-to-do',
    popular: true
  },
  activities: {
    name: 'Activities',
    icon: '🎿',
    description: 'Adventure sports, classes, unique experiences',
    urlSuffix: '/activities',
    popular: true
  },
  insurance: {
    name: 'Travel Insurance',
    icon: '🛡️',
    description: 'Trip protection, medical coverage, cancellation',
    urlSuffix: '/travel-insurance',
    popular: true
  },
  carRental: {
    name: 'Car Rental',
    icon: '🚗',
    description: 'Rent cars, SUVs, and vans',
    urlSuffix: '/car-rental',
    popular: true
  },
  bikeRental: {
    name: 'Bike & Scooter Rental',
    icon: '🚲',
    description: 'Bikes, e-bikes, and scooters',
    urlSuffix: '/bike-rental',
    popular: false
  },
  transfers: {
    name: 'Airport Transfers',
    icon: '🚐',
    description: 'Private transfers, shared shuttles',
    urlSuffix: '/airport-transfer',
    popular: true
  },
  trains: {
    name: 'Train Tickets',
    icon: '🚄',
    description: 'Rail passes and point-to-point tickets',
    urlSuffix: '/rail',
    popular: false
  },
  buses: {
    name: 'Bus & Coach',
    icon: '🚌',
    description: 'Bus tickets and passes',
    urlSuffix: '/bus',
    popular: false
  },
  wifi: {
    name: 'WiFi & SIM Cards',
    icon: '📱',
    description: 'Portable WiFi, eSIM, local SIM cards',
    urlSuffix: '/wifi-sim',
    popular: true
  },
  attractions: {
    name: 'Attraction Tickets',
    icon: '🎟️',
    description: 'Skip-the-line tickets to top attractions',
    urlSuffix: '/attractions',
    popular: true
  }
};

// Popular activities per city (curated suggestions)
const CITY_HIGHLIGHTS = {
  'Paris': [
    { name: 'Eiffel Tower Summit', type: 'attractions', priceFrom: 35 },
    { name: 'Louvre Museum Skip-the-Line', type: 'attractions', priceFrom: 22 },
    { name: 'Seine River Cruise', type: 'tours', priceFrom: 15 },
    { name: 'Versailles Day Trip', type: 'tours', priceFrom: 55 }
  ],
  'Barcelona': [
    { name: 'Sagrada Familia Fast Track', type: 'attractions', priceFrom: 26 },
    { name: 'Park Güell Guided Tour', type: 'tours', priceFrom: 22 },
    { name: 'Camp Nou Stadium Tour', type: 'attractions', priceFrom: 28 },
    { name: 'Flamenco Show', type: 'activities', priceFrom: 35 }
  ],
  'Rome': [
    { name: 'Colosseum & Forum Skip-the-Line', type: 'attractions', priceFrom: 24 },
    { name: 'Vatican Museums & Sistine Chapel', type: 'attractions', priceFrom: 32 },
    { name: 'Rome Food Tour', type: 'tours', priceFrom: 45 },
    { name: 'Pompeii Day Trip', type: 'tours', priceFrom: 65 }
  ],
  'Amsterdam': [
    { name: 'Anne Frank House', type: 'attractions', priceFrom: 16 },
    { name: 'Van Gogh Museum', type: 'attractions', priceFrom: 22 },
    { name: 'Canal Cruise', type: 'tours', priceFrom: 14 },
    { name: 'Keukenhof Gardens (seasonal)', type: 'tours', priceFrom: 35 }
  ],
  'Prague': [
    { name: 'Prague Castle Tour', type: 'tours', priceFrom: 20 },
    { name: 'River Cruise with Dinner', type: 'tours', priceFrom: 45 },
    { name: 'Czech Beer Tour', type: 'activities', priceFrom: 35 },
    { name: 'Český Krumlov Day Trip', type: 'tours', priceFrom: 55 }
  ],
  'Berlin': [
    { name: 'Berlin Wall & Cold War Tour', type: 'tours', priceFrom: 18 },
    { name: 'Reichstag Dome Visit', type: 'attractions', priceFrom: 0 },
    { name: 'Sachsenhausen Memorial', type: 'tours', priceFrom: 25 },
    { name: 'Street Art Tour', type: 'tours', priceFrom: 15 }
  ],
  'Vienna': [
    { name: 'Schönbrunn Palace', type: 'attractions', priceFrom: 24 },
    { name: 'Vienna Concert Tickets', type: 'activities', priceFrom: 45 },
    { name: 'Coffee House Walking Tour', type: 'tours', priceFrom: 28 },
    { name: 'Wachau Valley Wine Trip', type: 'tours', priceFrom: 65 }
  ],
  'Budapest': [
    { name: 'Thermal Bath Entry', type: 'activities', priceFrom: 22 },
    { name: 'Danube River Cruise', type: 'tours', priceFrom: 18 },
    { name: 'Ruin Bar Tour', type: 'tours', priceFrom: 25 },
    { name: 'Parliament Building Tour', type: 'attractions', priceFrom: 15 }
  ],
  'Lisbon': [
    { name: 'Sintra & Cascais Day Trip', type: 'tours', priceFrom: 45 },
    { name: 'Tram 28 & Alfama Tour', type: 'tours', priceFrom: 22 },
    { name: 'Fado Night Show', type: 'activities', priceFrom: 35 },
    { name: 'Belém Tower & Pastéis', type: 'tours', priceFrom: 18 }
  ],
  'Athens': [
    { name: 'Acropolis Skip-the-Line', type: 'attractions', priceFrom: 20 },
    { name: 'Delphi Day Trip', type: 'tours', priceFrom: 85 },
    { name: 'Greek Cooking Class', type: 'activities', priceFrom: 55 },
    { name: 'Santorini Day Trip', type: 'tours', priceFrom: 150 }
  ]
};

/**
 * Generate Klook affiliate link for a city/category
 */
function generateKlookLink(city, category = null) {
  const cityInfo = KLOOK_CITY_IDS[city];
  const affiliateBase = KLOOK_AFFILIATE_BASE;

  // If it's a tracking pixel link, we can't append paths easily
  // So we return the base affiliate link which redirects to Klook homepage
  // The user will navigate from there

  // For proper deep linking, we'd need the Klook deep link format
  // https://www.klook.com/city/{cityId}/{slug}/
  if (cityInfo && category && ADDON_CATEGORIES[category]) {
    const categoryInfo = ADDON_CATEGORIES[category];
    // Best effort: append city and category to affiliate link
    // Note: This may not work with all affiliate link formats
    return `${affiliateBase}?city=${cityInfo.slug}&cat=${category}`;
  }

  if (cityInfo) {
    return `${affiliateBase}?city=${cityInfo.slug}`;
  }

  return affiliateBase;
}

/**
 * Generate direct Klook URL (non-affiliate, for reference)
 */
function generateKlookDirectUrl(city, category = null) {
  const cityInfo = KLOOK_CITY_IDS[city];
  if (!cityInfo) return 'https://www.klook.com';

  const base = `https://www.klook.com/city/${cityInfo.id}/${cityInfo.slug}`;

  if (category && ADDON_CATEGORIES[category]) {
    return `${base}${ADDON_CATEGORIES[category].urlSuffix}`;
  }

  return base;
}

/**
 * Get add-ons for a destination
 */
function getAddonsForCity(city) {
  const cacheKey = `addons:${city}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const cityInfo = KLOOK_CITY_IDS[city];
  const highlights = CITY_HIGHLIGHTS[city] || [];

  // Build category links
  const categories = Object.entries(ADDON_CATEGORIES).map(([key, cat]) => ({
    id: key,
    ...cat,
    link: generateKlookLink(city, key),
    directUrl: generateKlookDirectUrl(city, key),
    available: cityInfo !== undefined
  }));

  // Filter to popular categories for cleaner UI
  const popularCategories = categories.filter(cat => cat.popular);

  const result = {
    city,
    available: cityInfo !== undefined,
    affiliateLink: generateKlookLink(city),

    // Popular categories (what most users want)
    popularCategories: popularCategories,

    // All categories
    allCategories: categories,

    // City-specific highlights
    highlights: highlights.map(h => ({
      ...h,
      bookingLink: generateKlookLink(city, h.type)
    })),

    // Quick links for common needs
    quickLinks: {
      tours: generateKlookLink(city, 'tours'),
      attractions: generateKlookLink(city, 'attractions'),
      transfers: generateKlookLink(city, 'transfers'),
      carRental: generateKlookLink(city, 'carRental'),
      insurance: generateKlookLink(city, 'insurance'),
      wifi: generateKlookLink(city, 'wifi')
    }
  };

  cache.set(cacheKey, result);
  return result;
}

/**
 * Get all available add-on categories
 */
function getAllCategories() {
  return Object.entries(ADDON_CATEGORIES).map(([key, cat]) => ({
    id: key,
    ...cat,
    globalLink: KLOOK_AFFILIATE_BASE
  }));
}

/**
 * Get insurance options
 */
function getInsuranceOptions(destination, tripDuration, travelers = 1) {
  // Insurance pricing estimates (GBP)
  const basePrices = {
    basic: 15,    // Basic coverage
    standard: 35, // Standard with medical
    premium: 65   // Premium with cancellation
  };

  // Adjust by trip duration
  const durationMultiplier = tripDuration <= 3 ? 1 : tripDuration <= 7 ? 1.5 : 2;

  return {
    options: [
      {
        tier: 'basic',
        name: 'Basic Coverage',
        description: 'Emergency medical assistance',
        price: Math.round(basePrices.basic * durationMultiplier * travelers),
        features: ['Emergency medical', '24/7 assistance'],
        bookingLink: generateKlookLink(destination, 'insurance')
      },
      {
        tier: 'standard',
        name: 'Standard Coverage',
        description: 'Medical + baggage protection',
        price: Math.round(basePrices.standard * durationMultiplier * travelers),
        features: ['Emergency medical', 'Baggage loss', 'Trip delay', '24/7 assistance'],
        bookingLink: generateKlookLink(destination, 'insurance'),
        recommended: true
      },
      {
        tier: 'premium',
        name: 'Premium Coverage',
        description: 'Full protection with cancellation',
        price: Math.round(basePrices.premium * durationMultiplier * travelers),
        features: ['Emergency medical', 'Baggage loss', 'Trip cancellation', 'Trip interruption', '24/7 assistance'],
        bookingLink: generateKlookLink(destination, 'insurance')
      }
    ],
    disclaimer: 'Insurance prices are estimates. Actual prices and coverage shown on booking site.',
    affiliateLink: generateKlookLink(destination, 'insurance')
  };
}

/**
 * Get car rental options for a destination
 */
function getCarRentalOptions(destination, pickupDate, returnDate, drivers = 1) {
  const days = Math.ceil((new Date(returnDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24));

  // Base daily rates by car type (GBP)
  const carTypes = [
    {
      type: 'economy',
      name: 'Economy',
      description: 'Small car, great for city driving',
      example: 'Fiat 500, VW Polo',
      dailyRate: 25,
      icon: '🚗'
    },
    {
      type: 'compact',
      name: 'Compact',
      description: 'Perfect for couples or small groups',
      example: 'VW Golf, Ford Focus',
      dailyRate: 35,
      icon: '🚙'
    },
    {
      type: 'suv',
      name: 'SUV',
      description: 'Space for luggage and comfort',
      example: 'Nissan Qashqai, VW Tiguan',
      dailyRate: 55,
      icon: '🚐'
    },
    {
      type: 'premium',
      name: 'Premium',
      description: 'Travel in style',
      example: 'BMW 3 Series, Mercedes C-Class',
      dailyRate: 75,
      icon: '🏎️'
    }
  ];

  return {
    destination,
    pickupDate,
    returnDate,
    days,
    options: carTypes.map(car => ({
      ...car,
      totalPrice: car.dailyRate * days,
      bookingLink: generateKlookLink(destination, 'carRental')
    })),
    disclaimer: 'Car rental prices are estimates. Actual prices shown on booking site.',
    affiliateLink: generateKlookLink(destination, 'carRental')
  };
}

/**
 * Get transfer options for airport to city
 */
function getTransferOptions(destination, travelers = 2) {
  // Transfer pricing estimates (GBP)
  const transferTypes = [
    {
      type: 'shared',
      name: 'Shared Shuttle',
      description: 'Budget-friendly shared transfer',
      pricePerPerson: 12,
      icon: '🚌'
    },
    {
      type: 'private',
      name: 'Private Transfer',
      description: 'Direct door-to-door service',
      priceFlat: 45,
      icon: '🚐'
    },
    {
      type: 'premium',
      name: 'Premium Car',
      description: 'Mercedes or similar',
      priceFlat: 75,
      icon: '🚘'
    }
  ];

  return {
    destination,
    travelers,
    options: transferTypes.map(t => ({
      ...t,
      price: t.priceFlat || t.pricePerPerson * travelers,
      bookingLink: generateKlookLink(destination, 'transfers')
    })),
    disclaimer: 'Transfer prices are estimates. Actual prices shown on booking site.',
    affiliateLink: generateKlookLink(destination, 'transfers')
  };
}

/**
 * Bundle add-ons for a package deal
 */
function bundleAddonsForPackage(city, nights, adults) {
  const addons = getAddonsForCity(city);
  const insurance = getInsuranceOptions(city, nights, adults);
  const transfers = getTransferOptions(city, adults);

  // Calculate a suggested add-ons total
  const suggestedAddons = {
    insurance: insurance.options.find(o => o.recommended) || insurance.options[1],
    transfers: transfers.options[0] // Shared shuttle as default
  };

  const addonsTotal =
    (suggestedAddons.insurance?.price || 0) +
    (suggestedAddons.transfers?.price || 0) * 2; // Round trip

  return {
    city,
    mainLink: KLOOK_AFFILIATE_BASE,
    categories: addons.popularCategories,
    highlights: addons.highlights,
    insurance,
    transfers,
    suggested: {
      items: suggestedAddons,
      total: addonsTotal,
      currency: 'GBP'
    },
    disclaimer: 'Add-on prices are estimates. Book directly for actual prices.'
  };
}

module.exports = {
  getAddonsForCity,
  getAllCategories,
  getInsuranceOptions,
  getCarRentalOptions,
  getTransferOptions,
  bundleAddonsForPackage,
  generateKlookLink,
  ADDON_CATEGORIES,
  KLOOK_AFFILIATE_BASE
};
