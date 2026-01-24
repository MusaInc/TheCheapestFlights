/**
 * Train Service
 *
 * Uses Klook affiliate links for train bookings.
 * Supports Eurostar and European rail services.
 */

const NodeCache = require('node-cache');

// Cache train results for 15 minutes
const cache = new NodeCache({ stdTTL: 900, checkperiod: 120 });

// Klook affiliate base URL
const KLOOK_AFFILIATE_BASE = process.env.KLOOK_AFFILIATE_URL || 'https://klook.tpx.lu/89cfHZHx';

// Train station codes for major European cities
const TRAIN_STATIONS = {
  'London': { code: 'STP', name: 'London St Pancras', trainTypes: ['eurostar'] },
  'Paris': { code: 'PLY', name: 'Paris Gare du Nord', trainTypes: ['eurostar', 'tgv'] },
  'Lyon': { code: 'LPD', name: 'Lyon Part-Dieu', trainTypes: ['tgv'] },
  'Nice': { code: 'NCE', name: 'Nice Ville', trainTypes: ['tgv'] },
  'Brussels': { code: 'BRU', name: 'Brussels Midi', trainTypes: ['eurostar', 'thalys'] },
  'Amsterdam': { code: 'AMS', name: 'Amsterdam Centraal', trainTypes: ['eurostar', 'thalys', 'ice'] },
  'Berlin': { code: 'BER', name: 'Berlin Hauptbahnhof', trainTypes: ['ice', 'ec'] },
  'Munich': { code: 'MUC', name: 'München Hauptbahnhof', trainTypes: ['ice', 'ec'] },
  'Cologne': { code: 'CGN', name: 'Köln Hauptbahnhof', trainTypes: ['ice', 'thalys'] },
  'Barcelona': { code: 'BCN', name: 'Barcelona Sants', trainTypes: ['ave', 'renfe'] },
  'Madrid': { code: 'MAD', name: 'Madrid Puerta de Atocha', trainTypes: ['ave', 'renfe'] },
  'Rome': { code: 'ROM', name: 'Roma Termini', trainTypes: ['frecciarossa', 'italo'] },
  'Milan': { code: 'MIL', name: 'Milano Centrale', trainTypes: ['frecciarossa', 'italo', 'tgv'] },
  'Venice': { code: 'VCE', name: 'Venezia Santa Lucia', trainTypes: ['frecciarossa', 'italo'] },
  'Naples': { code: 'NAP', name: 'Napoli Centrale', trainTypes: ['frecciarossa', 'italo'] },
  'Vienna': { code: 'VIE', name: 'Wien Hauptbahnhof', trainTypes: ['railjet', 'ice'] },
  'Prague': { code: 'PRG', name: 'Praha hlavní nádraží', trainTypes: ['railjet', 'ec'] },
  'Budapest': { code: 'BUD', name: 'Budapest Keleti', trainTypes: ['railjet', 'ec'] },
  'Lisbon': { code: 'LIS', name: 'Lisboa Santa Apolónia', trainTypes: ['alfa', 'ic'] },
  'Porto': { code: 'OPO', name: 'Porto Campanhã', trainTypes: ['alfa', 'ic'] },
  'Copenhagen': { code: 'CPH', name: 'København H', trainTypes: ['dsb', 'sj'] },
  'Stockholm': { code: 'STO', name: 'Stockholm Central', trainTypes: ['sj', 'x2000'] },
  'Zurich': { code: 'ZRH', name: 'Zürich Hauptbahnhof', trainTypes: ['tgv', 'ice', 'ec'] },
  'Krakow': { code: 'KRK', name: 'Kraków Główny', trainTypes: ['eic', 'tlk'] },
  'Warsaw': { code: 'WAW', name: 'Warszawa Centralna', trainTypes: ['eip', 'eic'] }
};

// Direct Eurostar routes from London
const DIRECT_EUROSTAR_ROUTES = ['Paris', 'Brussels', 'Amsterdam'];
const CONNECTING_TRAIN_ROUTES = ['Lyon', 'Nice', 'Cologne', 'Berlin', 'Munich', 'Milan', 'Rome', 'Barcelona'];

// Estimated journey times from London (hours)
const JOURNEY_TIMES = {
  'Paris': { direct: true, duration: 2.25, changes: 0 },
  'Brussels': { direct: true, duration: 2, changes: 0 },
  'Amsterdam': { direct: true, duration: 4, changes: 0 },
  'Lyon': { direct: false, duration: 5.5, changes: 1 },
  'Nice': { direct: false, duration: 8, changes: 1 },
  'Cologne': { direct: false, duration: 5, changes: 1 },
  'Berlin': { direct: false, duration: 10, changes: 2 },
  'Munich': { direct: false, duration: 9, changes: 2 },
  'Milan': { direct: false, duration: 8, changes: 1 },
  'Rome': { direct: false, duration: 12, changes: 2 },
  'Venice': { direct: false, duration: 11, changes: 2 },
  'Barcelona': { direct: false, duration: 10, changes: 2 },
  'Vienna': { direct: false, duration: 14, changes: 2 },
  'Prague': { direct: false, duration: 14, changes: 2 },
  'Budapest': { direct: false, duration: 18, changes: 3 }
};

// Base prices from London (GBP, return, estimates)
const BASE_TRAIN_PRICES = {
  'Paris': { min: 78, typical: 140, max: 300 },
  'Brussels': { min: 70, typical: 120, max: 260 },
  'Amsterdam': { min: 90, typical: 160, max: 320 },
  'Lyon': { min: 110, typical: 200, max: 360 },
  'Nice': { min: 140, typical: 260, max: 440 },
  'Cologne': { min: 100, typical: 180, max: 340 },
  'Berlin': { min: 160, typical: 300, max: 560 },
  'Munich': { min: 150, typical: 280, max: 520 },
  'Milan': { min: 140, typical: 260, max: 480 },
  'Rome': { min: 180, typical: 340, max: 600 },
  'Venice': { min: 170, typical: 320, max: 560 },
  'Barcelona': { min: 160, typical: 300, max: 560 },
  'Vienna': { min: 200, typical: 360, max: 640 },
  'Prague': { min: 190, typical: 340, max: 600 },
  'Budapest': { min: 220, typical: 400, max: 700 }
};

/**
 * Check if a city is reachable by train from London
 */
function isTrainAccessible(city) {
  return TRAIN_STATIONS.hasOwnProperty(city) &&
         (DIRECT_EUROSTAR_ROUTES.includes(city) || CONNECTING_TRAIN_ROUTES.includes(city) || JOURNEY_TIMES[city]);
}

/**
 * Get train station info for a city
 */
function getStationInfo(city) {
  return TRAIN_STATIONS[city] || null;
}

/**
 * Generate Klook train search URL
 */
function generateKlookTrainUrl(originCity, destCity, outboundDate, returnDate) {
  const params = new URLSearchParams({
    from: originCity.toLowerCase(),
    to: destCity.toLowerCase(),
    outbound: outboundDate,
    return: returnDate || ''
  });

  return `${KLOOK_AFFILIATE_BASE}?${params.toString()}`;
}

/**
 * Calculate estimated train price based on demand factors
 */
function calculateTrainPrice(city, departureDate, adults = 2) {
  const priceRange = BASE_TRAIN_PRICES[city];
  if (!priceRange) return null;

  const date = new Date(departureDate);
  const dayOfWeek = date.getDay();
  const month = date.getMonth();

  // Price modifiers
  let modifier = 1;

  // Weekend travel is more expensive
  if (dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6) {
    modifier *= 1.25;
  }

  // Peak summer months
  if (month >= 5 && month <= 8) {
    modifier *= 1.2;
  }

  // Booking advance discount
  const daysAhead = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));
  if (daysAhead > 60) {
    modifier *= 0.85;
  } else if (daysAhead > 30) {
    modifier *= 0.95;
  } else if (daysAhead < 7) {
    modifier *= 1.35;
  }

  // Calculate price per person (return)
  const basePrice = priceRange.min + (priceRange.typical - priceRange.min) * Math.random();
  const adjustedPrice = Math.round(basePrice * modifier);

  return {
    perPerson: adjustedPrice,
    total: adjustedPrice * adults,
    priceRange: {
      min: priceRange.min * adults,
      max: priceRange.max * adults
    }
  };
}

/**
 * Search for train options between cities
 */
async function searchTrains(origin, destination, departureDate, returnDate, adults = 2) {
  const cacheKey = `trains:${origin}:${destination}:${departureDate}:${returnDate}:${adults}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Normalize city names
  const originCity = normalizeCity(origin);
  const destCity = normalizeCity(destination);

  // Check if route is supported
  if (!isTrainAccessible(destCity) || originCity !== 'London') {
    return null;
  }

  const journeyInfo = JOURNEY_TIMES[destCity];
  const stationInfo = getStationInfo(destCity);
  const pricing = calculateTrainPrice(destCity, departureDate, adults);

  if (!journeyInfo || !stationInfo || !pricing) {
    return null;
  }

  // Generate Klook booking URL
  const bookingLink = generateKlookTrainUrl(originCity, destCity, departureDate, returnDate);

  const result = {
    type: 'train',
    destination: destCity,
    origin: originCity,

    // Journey details
    outboundDate: departureDate,
    returnDate: returnDate,

    // Station info
    originStation: TRAIN_STATIONS['London'],
    destinationStation: stationInfo,

    // Journey specifics
    duration: `${Math.floor(journeyInfo.duration)}h ${Math.round((journeyInfo.duration % 1) * 60)}m`,
    durationHours: journeyInfo.duration,
    isDirect: journeyInfo.direct,
    changes: journeyInfo.changes,
    trainTypes: stationInfo.trainTypes,

    // Pricing
    price: pricing.total,
    pricePerPerson: pricing.perPerson,
    currency: 'GBP',
    priceRange: pricing.priceRange,

    // Klook booking link
    bookingLink: bookingLink,

    // Metadata
    disclaimer: 'Estimated prices. Check Klook for live availability and rates.',
    isEstimate: true
  };

  cache.set(cacheKey, result);
  return result;
}

/**
 * Normalize city name to match our database
 */
function normalizeCity(input) {
  if (!input) return null;

  const mapping = {
    'LON': 'London',
    'LONDON': 'London',
    'PAR': 'Paris',
    'PARIS': 'Paris',
    'CDG': 'Paris',
    'BRU': 'Brussels',
    'BRUSSELS': 'Brussels',
    'AMS': 'Amsterdam',
    'AMSTERDAM': 'Amsterdam',
    'BCN': 'Barcelona',
    'BARCELONA': 'Barcelona',
    'MAD': 'Madrid',
    'MADRID': 'Madrid',
    'ROM': 'Rome',
    'ROME': 'Rome',
    'FCO': 'Rome',
    'MIL': 'Milan',
    'MILAN': 'Milan',
    'MXP': 'Milan',
    'VCE': 'Venice',
    'VENICE': 'Venice',
    'VIE': 'Vienna',
    'VIENNA': 'Vienna',
    'PRG': 'Prague',
    'PRAGUE': 'Prague',
    'BUD': 'Budapest',
    'BUDAPEST': 'Budapest',
    'BER': 'Berlin',
    'BERLIN': 'Berlin',
    'MUC': 'Munich',
    'MUNICH': 'Munich',
    'LIS': 'Lisbon',
    'LISBON': 'Lisbon',
    'OPO': 'Porto',
    'PORTO': 'Porto',
    'CPH': 'Copenhagen',
    'COPENHAGEN': 'Copenhagen',
    'ARN': 'Stockholm',
    'STOCKHOLM': 'Stockholm',
    'NCE': 'Nice',
    'NICE': 'Nice',
    'LYS': 'Lyon',
    'LYON': 'Lyon',
    'NAP': 'Naples',
    'NAPLES': 'Naples',
    'KRK': 'Krakow',
    'KRAKOW': 'Krakow',
    'WAW': 'Warsaw',
    'WARSAW': 'Warsaw'
  };

  const upper = input.toUpperCase().trim();
  return mapping[upper] || input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
}

/**
 * Get all train-accessible destinations
 */
function getTrainDestinations() {
  return Object.keys(JOURNEY_TIMES).map(city => ({
    city,
    ...TRAIN_STATIONS[city],
    journeyTime: JOURNEY_TIMES[city],
    pricing: BASE_TRAIN_PRICES[city]
  }));
}

module.exports = {
  searchTrains,
  isTrainAccessible,
  getStationInfo,
  generateKlookTrainUrl,
  getTrainDestinations,
  normalizeCity,
  TRAIN_STATIONS,
  JOURNEY_TIMES,
  BASE_TRAIN_PRICES,
  KLOOK_AFFILIATE_BASE
};
