/**
 * Package Assembly Service
 *
 * This is the CORE VALUE of the platform.
 * Combines the cheapest transport (flight OR train) + cheapest acceptable hotel
 * into a single "holiday package" per destination.
 *
 * Now supports:
 * - Flights (via Booking.com/Skyscanner estimates)
 * - Trains (via Eurostar/Trainline estimates)
 * - Add-ons (via Klook affiliate)
 */

const { DESTINATIONS, DEFAULT_ORIGIN } = require('../config/destinations');
const flightService = require('./flights');
const hotelService = require('./hotels');
const trainService = require('./trains');
const addonsService = require('./addons');
const restaurantsService = require('./restaurants');
const { getKlookHotelLink } = require('../config/klookHotels');

const ORIGIN_ALIASES = {
  LONDON: 'LON',
  LHR: 'LON',
  LGW: 'LON',
  STN: 'LON',
  LTN: 'LON',
  LCY: 'LON',
  SEN: 'LON',
  MANCHESTER: 'MAN',
  BIRMINGHAM: 'BHX',
  EDINBURGH: 'EDI',
  DUBLIN: 'DUB'
};

function normalizeOrigin(origin) {
  if (!origin) return DEFAULT_ORIGIN;
  const normalized = String(origin).trim().toUpperCase();
  return ORIGIN_ALIASES[normalized] || normalized;
}

function resolveConcurrency(value, fallback = 5) {
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return parsed;
}

function resolveMinResults(value, fallback = 6) {
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return parsed;
}

function resolveDateSamples(value, fallback = 5) {
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return parsed;
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let index = 0;

  const workers = new Array(Math.min(limit, items.length)).fill(null).map(async () => {
    while (index < items.length) {
      const currentIndex = index;
      index += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  });

  await Promise.all(workers);
  return results;
}

/**
 * Search for holiday packages to multiple destinations
 *
 * This is the main search function called by the frontend.
 * It queries flights/trains and hotels in parallel for efficiency.
 *
 * @param {Object} options Search options
 * @param {string} options.origin - Origin airport (default: LON)
 * @param {number} options.nights - Stay length (default: 4)
 * @param {number} options.adults - Number of adults (default: 2)
 * @param {number} options.maxBudget - Maximum total budget in GBP
 * @param {string} options.mood - 'sun', 'city', or 'random'
 * @param {string} options.transportType - 'flight', 'train', or 'any' (default: 'any')
 * @param {boolean} options.includeAddons - Include add-ons data (default: true)
 * @param {boolean} options.debug - Enable verbose logging
 * @param {boolean} options.relaxBudget - Skip budget filtering
 * @param {boolean} options.relaxMood - Skip mood filtering
 * @param {Array} options.fixedDates - Optional array of { outbound, return, nights }
 * @returns {Promise<Object>} Object with packages array and metadata
 */
async function searchPackages(options = {}) {
  const {
    origin = DEFAULT_ORIGIN,
    nights = 4,
    adults = 2,
    maxBudget = 500,
    mood = 'random',
    transportType = 'any',
    includeAddons = true,
    debug = false,
    relaxBudget = false,
    relaxMood = false,
    fixedDates = null
  } = options;

  const normalizedOrigin = normalizeOrigin(origin);
  const isLondonOrigin = normalizedOrigin === 'LON';

  // Filter destinations by mood if specified
  const destinations = relaxMood ? DESTINATIONS : filterDestinationsByMood(DESTINATIONS, mood);

  // Generate search dates (2-6 months ahead)
  const searchDates = Array.isArray(fixedDates) && fixedDates.length > 0
    ? fixedDates
    : generateOptimalDates(nights);

  if (debug) {
    console.log('Package search params:', {
      origin: normalizedOrigin,
      nights,
      adults,
      maxBudget,
      mood,
      transportType,
      relaxBudget,
      relaxMood,
      dateSamples: searchDates.length
    });
  }

  console.log(`Searching ${destinations.length} destinations for ${nights}-night trips (transport: ${transportType})...`);

  const stats = {
    destinations: destinations.length,
    flightsFound: 0,
    trainsFound: 0,
    overBudget: 0,
    packagesBuilt: 0,
    errors: 0
  };

  const concurrency = resolveConcurrency(process.env.PACKAGE_SEARCH_CONCURRENCY, 5);
  const minResults = resolveMinResults(process.env.PACKAGE_MIN_RESULTS, 6);
  const dateSampleLimit = resolveDateSamples(process.env.PACKAGE_DATE_SAMPLES, 5);
  const hasLiveFlights = Boolean(
    process.env.BOOKING_FLIGHTS_RAPIDAPI_KEY || process.env.RAPIDAPI_KEY
  );
  const hasLiveHotels = Boolean(process.env.RAPIDAPI_KEY && process.env.RAPIDAPI_HOST);
  const requireLiveFlights = process.env.REQUIRE_LIVE_FLIGHTS === 'true' && hasLiveFlights;
  const requireLiveHotels = process.env.REQUIRE_LIVE_HOTELS === 'true' && hasLiveHotels;
  const requireHotelImages = process.env.REQUIRE_HOTEL_IMAGES === 'true' && hasLiveHotels;

  // Search flights and hotels with a concurrency cap per destination batch
  const results = await mapWithConcurrency(destinations, concurrency, async (dest) => {
    try {
      let bestTransport = null;
      let transportSource = null;

      // Try to find the best transport option
      for (const dates of searchDates.slice(0, dateSampleLimit)) {
        // Search flights if allowed
        if (transportType === 'flight' || transportType === 'any') {
          const flight = await flightService.searchFlights(
            normalizedOrigin,
            dest.iata,
            dates.outbound,
            dates.return,
            adults
          );

          if (flight && (!bestTransport || flight.price < bestTransport.price)) {
            bestTransport = {
              ...flight,
              type: 'flight',
              outboundDate: dates.outbound,
              returnDate: dates.return
            };
            transportSource = 'flight';
          }
        }

        // Search trains if allowed and origin is London
        if ((transportType === 'train' || transportType === 'any') && isLondonOrigin) {
          const train = await trainService.searchTrains(
            'London',
            dest.city,
            dates.outbound,
            dates.return,
            adults
          );

          if (train && (!bestTransport || train.price < bestTransport.price)) {
            bestTransport = {
              ...train,
              type: 'train',
              outboundDate: dates.outbound,
              returnDate: dates.return,
              // Normalize train data to match flight structure
              price: train.price,
              currency: train.currency,
              outboundDeparture: `${dates.outbound}T08:00:00`,
              outboundArrival: calculateArrival(dates.outbound, train.durationHours),
              outboundStops: train.changes,
              inboundStops: train.changes,
              airlines: train.trainTypes || [],
              validatingAirline: train.trainTypes?.[0] || 'TRAIN',
              duration: {
                outbound: train.duration,
                inbound: train.duration
              },
              bookingLink: train.bookingLink
            };
            transportSource = 'train';
          }
        }
      }

      if (!bestTransport) {
        if (debug) {
          console.log(`No transport found for ${dest.iata} from ${normalizedOrigin}`);
        }
        return null;
      }

      if (
        transportSource === 'flight' &&
        requireLiveFlights &&
        bestTransport.isRealPrice === false
      ) {
        if (debug) {
          console.log(`Skipping ${dest.iata}: live flight required`);
        }
        return null;
      }

      if (transportSource === 'flight') {
        stats.flightsFound += 1;
      } else {
        stats.trainsFound += 1;
      }

      // Get hotel search URL and estimate
      const hotelSearch = await hotelService.searchHotels(
        dest.city,
        bestTransport.outboundDate,
        bestTransport.returnDate,
        adults
      );

      if (requireLiveHotels && hotelSearch.source !== 'rapidapi') {
        if (debug) {
          console.log(`Skipping ${dest.iata}: live hotel data required`);
        }
        return null;
      }

      // Calculate total package estimate
      const hotelEstimate = hotelService.calculateHotelEstimate(dest.city, nights);
      const hotelOptions = Array.isArray(hotelSearch.hotels) ? hotelSearch.hotels : [];
      const sortedHotels = hotelOptions
        .filter((hotel) => Number.isFinite(hotel.price) && hotel.price > 0)
        .sort((a, b) => a.price - b.price);
      const hotelsWithImages = requireHotelImages
        ? sortedHotels.filter((hotel) => Boolean(hotel.image))
        : sortedHotels;
      const cheapestHotel = hotelsWithImages[0] || sortedHotels[0] || null;
      const imageHotel = hotelsWithImages.find((hotel) => Boolean(hotel.image)) || cheapestHotel;
      if (requireHotelImages && !imageHotel?.image) {
        if (debug) {
          console.log(`Skipping ${dest.iata}: hotel image required`);
        }
        return null;
      }
      const fallbackHotelPrice = hotelEstimate.min;
      const hotelPrice = cheapestHotel ? cheapestHotel.price : fallbackHotelPrice;
      const totalEstimate = bestTransport.price + hotelPrice;
      const isOverBudget = !relaxBudget && maxBudget > 0 && totalEstimate > maxBudget;

      // Skip if over budget unless relaxBudget is enabled
      if (isOverBudget) {
        stats.overBudget += 1;
        if (debug) {
          console.log(`Over budget for ${dest.iata}: ${totalEstimate} > ${maxBudget}`);
        }
      }

      stats.packagesBuilt += 1;

      // Get add-ons if requested
      let addons = null;
      let restaurants = null;
      let restaurantLink = null;
      let restaurantDisclaimer = null;
      if (includeAddons) {
        try {
          addons = addonsService.bundleAddonsForPackage(dest.city, nights, adults);
        } catch (e) {
          // Add-ons are optional, don't fail the package
          console.warn(`Add-ons error for ${dest.city}:`, e.message);
        }

        try {
          const restaurantResult = await restaurantsService.searchRestaurants(dest.city, { limit: 6 });
          if (restaurantResult?.restaurants?.length) {
            restaurants = restaurantResult.restaurants;
            restaurantLink = restaurantResult.searchLink || null;
            restaurantDisclaimer = restaurantResult.disclaimer || null;
          }
        } catch (e) {
          console.warn(`Restaurant error for ${dest.city}:`, e.message);
        }
      }

      const partnerLink = getKlookHotelLink(dest.city);
      const pkg = {
        id: `pkg-${dest.iata}-${Date.now()}`,
        city: dest.city,
        country: dest.country,
        iata: dest.iata,
        lat: dest.lat,
        lng: dest.lng,
        nights: nights,

        // Transport type indicator
        transportType: transportSource,

        // Transport details (flight or train)
        transport: {
          type: transportSource,
          price: bestTransport.price,
          currency: bestTransport.currency || 'GBP',
          outboundDate: bestTransport.outboundDate,
          returnDate: bestTransport.returnDate,
          outboundDeparture: bestTransport.outboundDeparture,
          outboundArrival: bestTransport.outboundArrival,
          outboundStops: bestTransport.outboundStops,
          inboundStops: bestTransport.inboundStops,
          carriers: bestTransport.airlines || bestTransport.trainTypes || [],
          validatingCarrier: bestTransport.validatingAirline || bestTransport.trainTypes?.[0],
          duration: bestTransport.duration,
          bookingLink: bestTransport.bookingLink || null,
          // Train-specific
          isDirect: transportSource === 'train' ? bestTransport.isDirect : bestTransport.outboundStops === 0,
          trainTypes: transportSource === 'train' ? bestTransport.trainTypes : null
        },

        // Legacy flight field for backward compatibility
        flight: {
          price: bestTransport.price,
          currency: bestTransport.currency || 'GBP',
          outboundDate: bestTransport.outboundDate,
          returnDate: bestTransport.returnDate,
          outboundDeparture: bestTransport.outboundDeparture,
          outboundArrival: bestTransport.outboundArrival,
          outboundStops: bestTransport.outboundStops,
          inboundStops: bestTransport.inboundStops,
          airlines: bestTransport.airlines || [],
          validatingAirline: bestTransport.validatingAirline || '',
          duration: bestTransport.duration
        },

        // Hotel details (search URL + estimate)
        hotel: {
          searchUrl: hotelSearch.searchUrl,
          bookingLink: imageHotel?.bookingLink || cheapestHotel?.bookingLink || hotelSearch.searchUrl,
          partnerLink: partnerLink || null,
          partnerName: partnerLink ? 'Klook' : undefined,
          id: imageHotel?.id || cheapestHotel?.id || `${dest.iata}-${Date.now()}`,
          name: imageHotel?.name || cheapestHotel?.name || `${dest.city} stay`,
          image: imageHotel?.image || '',
          rating: imageHotel?.rating || cheapestHotel?.rating || 0,
          price: hotelPrice,
          priceRange: cheapestHotel?.priceRange || hotelEstimate,
          disclaimer: hotelSearch.disclaimer
        },

        // Hotel options (top 3 cheapest)
        hotelOptions: sortedHotels.slice(0, 3).map(h => ({
          id: h.id,
          name: h.name,
          image: h.image,
          rating: h.rating,
          price: h.price,
          bookingLink: h.bookingLink || hotelSearch.searchUrl
        })),

        // Add-ons (tours, activities, insurance, etc.)
        addons: (() => {
          const payload = addons
            ? {
                available: true,
                mainLink: addons.mainLink,
                categories: addons.categories,
                highlights: addons.highlights,
                insurance: addons.insurance?.options?.[1] || null, // Recommended tier
                transfers: addons.transfers?.options?.[0] || null, // Shared shuttle
                suggestedTotal: addons.suggested?.total || 0
              }
            : { available: false };

          if (restaurants) payload.restaurants = restaurants;
          if (restaurantLink) payload.restaurantLink = restaurantLink;
          if (restaurantDisclaimer) payload.restaurantDisclaimer = restaurantDisclaimer;

          return payload;
        })(),

        // Total package
        totalPrice: totalEstimate,
        currency: 'GBP',
        priceBreakdown: {
          transport: bestTransport.price,
          flight: transportSource === 'flight' ? bestTransport.price : 0,
          train: transportSource === 'train' ? bestTransport.price : 0,
          hotel: hotelPrice,
          hotelEstimate: hotelEstimate.average,
          addonsEstimate: addons?.suggested?.total || 0
        },

        // Grand total with suggested add-ons
        totalWithAddons: totalEstimate + (addons?.suggested?.total || 0),

        // Metadata
        searchedAt: new Date().toISOString(),
        validUntil: bestTransport.lastTicketingDate || null,
        adults: adults
      };

      return { package: pkg, overBudget: isOverBudget };

    } catch (error) {
      stats.errors += 1;
      console.error(`Error searching ${dest.city}:`, error.message);
      return null;
    }
  });

  const withinBudget = [];
  const overBudget = [];
  results.forEach((entry) => {
    if (!entry) return;
    if (entry.overBudget) {
      overBudget.push(entry.package);
    } else {
      withinBudget.push(entry.package);
    }
  });

  const sortByPrice = (a, b) => a.totalPrice - b.totalPrice;
  let packages = withinBudget.sort(sortByPrice);
  let exactMatch = true;

  if (packages.length === 0 && overBudget.length > 0) {
    packages = overBudget.sort(sortByPrice).slice(0, minResults);
    exactMatch = false;
  } else if (packages.length < minResults && overBudget.length > 0) {
    const needed = minResults - packages.length;
    const fallback = overBudget.sort(sortByPrice).slice(0, needed);
    if (fallback.length > 0) {
      packages = packages.concat(fallback);
      exactMatch = false;
    }
  }

  if (exactMatch) {
    console.log(`Found ${packages.length} packages within budget (${stats.flightsFound} flights, ${stats.trainsFound} trains)`);
  } else {
    console.log(`No packages within budget, returning ${packages.length} fallback options`);
  }
  if (debug) {
    console.log('Package search stats:', stats);
  }

  return { packages, exactMatch, stats };
}

/**
 * Calculate arrival time given departure and duration
 */
function calculateArrival(departureDate, durationHours) {
  const departure = new Date(`${departureDate}T08:00:00`);
  departure.setMinutes(departure.getMinutes() + durationHours * 60);
  return departure.toISOString();
}

/**
 * Filter destinations by mood/category
 */
function filterDestinationsByMood(destinations, mood) {
  if (mood === 'random') {
    return destinations;
  }

  const sunDestinations = [
    'Barcelona', 'Malaga', 'Alicante', 'Palma', 'Tenerife',
    'Lisbon', 'Faro', 'Nice', 'Rome', 'Naples',
    'Dubrovnik', 'Split', 'Athens'
  ];

  const cityDestinations = [
    'Paris', 'Amsterdam', 'Berlin', 'Prague', 'Budapest',
    'Vienna', 'Copenhagen', 'Stockholm', 'Krakow', 'Warsaw',
    'Riga', 'Tallinn', 'Brussels', 'Milan'
  ];

  const romanticDestinations = [
    'Paris', 'Venice', 'Rome', 'Lisbon', 'Nice', 'Prague', 'Vienna'
  ];

  const adventureDestinations = [
    'Tenerife', 'Athens', 'Dubrovnik', 'Split', 'Naples', 'Krakow'
  ];

  const chillDestinations = [
    'Palma', 'Malaga', 'Alicante', 'Faro', 'Lisbon', 'Porto', 'Nice', 'Tenerife'
  ];

  // Train-friendly destinations (accessible by Eurostar/rail from London)
  const trainFriendlyDestinations = [
    'Paris', 'Brussels', 'Amsterdam', 'Lyon', 'Nice', 'Cologne',
    'Berlin', 'Munich', 'Milan', 'Rome', 'Venice', 'Barcelona'
  ];

  if (mood === 'sun') {
    return destinations.filter(d => sunDestinations.includes(d.city));
  } else if (mood === 'city') {
    return destinations.filter(d => cityDestinations.includes(d.city));
  } else if (mood === 'romantic') {
    return destinations.filter(d => romanticDestinations.includes(d.city));
  } else if (mood === 'adventure') {
    return destinations.filter(d => adventureDestinations.includes(d.city));
  } else if (mood === 'chill') {
    return destinations.filter(d => chillDestinations.includes(d.city));
  } else if (mood === 'train') {
    return destinations.filter(d => trainFriendlyDestinations.includes(d.city));
  }

  return destinations;
}

/**
 * Generate optimal search dates for the next 6 months
 * Focuses on off-peak times for cheaper fares
 */
function generateOptimalDates(nights) {
  const dates = [];
  const now = new Date();

  // Search every 2 weeks for the next 6 months
  for (let weeksAhead = 3; weeksAhead <= 24; weeksAhead += 2) {
    const outbound = new Date(now);
    outbound.setDate(outbound.getDate() + (weeksAhead * 7));

    // Prefer midweek departures (cheaper)
    const dayOfWeek = outbound.getDay();
    if (dayOfWeek === 0) outbound.setDate(outbound.getDate() + 2); // Sun -> Tue
    if (dayOfWeek === 6) outbound.setDate(outbound.getDate() + 3); // Sat -> Tue

    const returnDate = new Date(outbound);
    returnDate.setDate(returnDate.getDate() + nights);

    dates.push({
      outbound: outbound.toISOString().split('T')[0],
      return: returnDate.toISOString().split('T')[0],
      nights: nights
    });
  }

  return dates;
}

/**
 * Get a single package for a specific destination
 */
async function getPackageByDestination(iata, options = {}) {
  const destination = DESTINATIONS.find(d => d.iata === iata);
  if (!destination) {
    throw new Error(`Unknown destination: ${iata}`);
  }

  const { packages } = await searchPackages({
    ...options,
    mood: 'random',
    relaxBudget: true,
    relaxMood: true
  });

  return packages.find(p => p.iata === iata) || null;
}

/**
 * Get train-only packages (for eco-conscious travelers)
 */
async function searchTrainPackages(options = {}) {
  return searchPackages({
    ...options,
    transportType: 'train',
    origin: 'LON' // Trains only from London currently
  });
}

/**
 * Compare flight vs train for a specific destination
 */
async function compareTransportOptions(destination, options = {}) {
  const { nights = 4, adults = 2 } = options;
  const dates = generateOptimalDates(nights)[0]; // Use first date option

  const [flight, train] = await Promise.all([
    flightService.searchFlights('LON', destination, dates.outbound, dates.return, adults),
    trainService.searchTrains('London', destination, dates.outbound, dates.return, adults)
  ]);

  return {
    destination,
    dates,
    flight: flight ? { available: true, price: flight.price, ...flight } : { available: false },
    train: train ? { available: true, price: train.price, ...train } : { available: false },
    recommendation: getTransportRecommendation(flight, train),
    carbonComparison: train ? {
      trainCO2: 'Low',
      flightCO2: 'High',
      savings: 'Train produces ~90% less CO2 than flying'
    } : null
  };
}

/**
 * Get transport recommendation based on price and duration
 */
function getTransportRecommendation(flight, train) {
  if (!flight && !train) return { mode: null, reason: 'No transport available' };
  if (!train) return { mode: 'flight', reason: 'Train not available for this route' };
  if (!flight) return { mode: 'train', reason: 'Flight not available, train is your best option' };

  const flightPrice = flight.price;
  const trainPrice = train.price;
  const trainDuration = train.durationHours || 99;

  // Train is great for short journeys
  if (trainDuration <= 4) {
    return {
      mode: 'train',
      reason: `Fast train journey (${train.duration}) - more comfortable and eco-friendly`,
      priceDiff: flightPrice - trainPrice
    };
  }

  // Price comparison for longer journeys
  if (trainPrice < flightPrice * 0.8) {
    return {
      mode: 'train',
      reason: `Train is ${Math.round((1 - trainPrice / flightPrice) * 100)}% cheaper`,
      priceDiff: flightPrice - trainPrice
    };
  }

  if (flightPrice < trainPrice * 0.7 && trainDuration > 6) {
    return {
      mode: 'flight',
      reason: `Flight is faster and ${Math.round((1 - flightPrice / trainPrice) * 100)}% cheaper`,
      priceDiff: trainPrice - flightPrice
    };
  }

  // Default to cheapest
  if (trainPrice <= flightPrice) {
    return {
      mode: 'train',
      reason: 'Train is cheaper and more eco-friendly',
      priceDiff: flightPrice - trainPrice
    };
  }

  return {
    mode: 'flight',
    reason: 'Flight is cheaper for this route',
    priceDiff: trainPrice - flightPrice
  };
}

module.exports = {
  searchPackages,
  getPackageByDestination,
  searchTrainPackages,
  compareTransportOptions,
  filterDestinationsByMood
};
