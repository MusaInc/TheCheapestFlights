/**
 * Package Assembly Service
 *
 * This is the CORE VALUE of the platform.
 * Combines the cheapest flight + cheapest acceptable hotel
 * into a single "holiday package" per destination.
 */

const { DESTINATIONS, DEFAULT_ORIGIN } = require('../config/destinations');
const amadeusService = require('./amadeus');
const hotelService = require('./hotels');

/**
 * Search for holiday packages to multiple destinations
 *
 * This is the main search function called by the frontend.
 * It queries flights and hotels in parallel for efficiency.
 *
 * @param {Object} options Search options
 * @param {string} options.origin - Origin airport (default: LON)
 * @param {number} options.nights - Stay length (default: 4)
 * @param {number} options.adults - Number of adults (default: 2)
 * @param {number} options.maxBudget - Maximum total budget in GBP
 * @param {string} options.mood - 'sun', 'city', or 'random'
 * @returns {Promise<Array>} Array of holiday packages sorted by price
 */
async function searchPackages(options = {}) {
  const {
    origin = DEFAULT_ORIGIN,
    nights = 4,
    adults = 2,
    maxBudget = 500,
    mood = 'random'
  } = options;

  // Filter destinations by mood if specified
  let destinations = filterDestinationsByMood(DESTINATIONS, mood);

  // Generate search dates (2-6 months ahead)
  const searchDates = generateOptimalDates(nights);

  console.log(`Searching ${destinations.length} destinations for ${nights}-night trips...`);

  // Search flights and hotels in parallel for each destination
  const packagePromises = destinations.map(async (dest) => {
    try {
      // Try multiple date ranges to find cheapest
      let cheapestFlight = null;

      for (const dates of searchDates.slice(0, 5)) { // Limit API calls
        const flight = await amadeusService.searchFlights(
          origin,
          dest.iata,
          dates.outbound,
          dates.return,
          adults
        );

        if (flight && (!cheapestFlight || flight.price < cheapestFlight.price)) {
          cheapestFlight = flight;
        }
      }

      if (!cheapestFlight) {
        return null; // No flights found
      }

      // Get hotel search URL and estimate
      const hotelSearch = await hotelService.searchHotels(
        dest.city,
        cheapestFlight.outboundDate,
        cheapestFlight.returnDate,
        adults
      );

      // Calculate total package estimate
      const hotelEstimate = hotelService.calculateHotelEstimate(dest.city, nights);
      const totalEstimate = cheapestFlight.price + hotelEstimate.average;

      // Skip if over budget
      if (totalEstimate > maxBudget) {
        return null;
      }

      return {
        id: `pkg-${dest.iata}-${Date.now()}`,
        city: dest.city,
        country: dest.country,
        iata: dest.iata,
        lat: dest.lat,
        lng: dest.lng,
        nights: nights,

        // Flight details (REAL from Amadeus)
        flight: {
          price: cheapestFlight.price,
          currency: cheapestFlight.currency,
          outboundDate: cheapestFlight.outboundDate,
          returnDate: cheapestFlight.returnDate,
          outboundDeparture: cheapestFlight.outboundDeparture,
          outboundArrival: cheapestFlight.outboundArrival,
          outboundStops: cheapestFlight.outboundStops,
          inboundStops: cheapestFlight.inboundStops,
          airlines: cheapestFlight.airlines,
          validatingAirline: cheapestFlight.validatingAirline,
          duration: cheapestFlight.duration
        },

        // Hotel details (search URL + estimate)
        hotel: {
          searchUrl: hotelSearch.searchUrl,
          estimatedPrice: hotelEstimate.average,
          priceRange: hotelEstimate,
          disclaimer: hotelSearch.disclaimer
        },

        // Total package
        totalPrice: totalEstimate,
        currency: 'GBP',
        priceBreakdown: {
          flight: cheapestFlight.price,
          hotelEstimate: hotelEstimate.average
        },

        // Metadata
        searchedAt: new Date().toISOString(),
        validUntil: cheapestFlight.lastTicketingDate,
        adults: adults
      };

    } catch (error) {
      console.error(`Error searching ${dest.city}:`, error.message);
      return null;
    }
  });

  // Wait for all searches to complete
  const results = await Promise.all(packagePromises);

  // Filter out failed searches and sort by total price
  const packages = results
    .filter(pkg => pkg !== null)
    .sort((a, b) => a.totalPrice - b.totalPrice);

  console.log(`Found ${packages.length} packages within budget`);

  return packages;
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

  if (mood === 'sun') {
    return destinations.filter(d => sunDestinations.includes(d.city));
  } else if (mood === 'city') {
    return destinations.filter(d => cityDestinations.includes(d.city));
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

  const packages = await searchPackages({
    ...options,
    mood: 'random' // Don't filter
  });

  return packages.find(p => p.iata === iata) || null;
}

module.exports = {
  searchPackages,
  getPackageByDestination,
  filterDestinationsByMood
};
