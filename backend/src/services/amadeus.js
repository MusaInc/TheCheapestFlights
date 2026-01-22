/**
 * Amadeus Flight Service
 *
 * Connects to the Amadeus API to fetch real flight prices.
 * Uses the Flight Offers Search API for specific routes and dates,
 * and Flight Inspiration Search for discovering cheap destinations.
 *
 * Documentation: https://developers.amadeus.com/self-service/apis-docs
 */

const Amadeus = require('amadeus');
const NodeCache = require('node-cache');

// Cache flight results for 15 minutes to reduce API calls
const cache = new NodeCache({ stdTTL: 900, checkperiod: 120 });

// Initialize Amadeus client
let amadeus = null;

function getClient() {
  if (!amadeus) {
    if (!process.env.AMADEUS_CLIENT_ID || !process.env.AMADEUS_CLIENT_SECRET) {
      throw new Error('Amadeus credentials not configured');
    }

    amadeus = new Amadeus({
      clientId: process.env.AMADEUS_CLIENT_ID,
      clientSecret: process.env.AMADEUS_CLIENT_SECRET,
      hostname: process.env.NODE_ENV === 'production' ? 'production' : 'test'
    });
  }
  return amadeus;
}

/**
 * Search for cheap flights to a specific destination
 *
 * @param {string} origin - Origin IATA code (e.g., 'LON')
 * @param {string} destination - Destination IATA code (e.g., 'BCN')
 * @param {string} departureDate - YYYY-MM-DD format
 * @param {string} returnDate - YYYY-MM-DD format
 * @param {number} adults - Number of adults (default 2)
 * @returns {Promise<Object>} Flight offer details
 */
async function searchFlights(origin, destination, departureDate, returnDate, adults = 2) {
  const cacheKey = `flights:${origin}:${destination}:${departureDate}:${returnDate}:${adults}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log(`Cache hit: ${cacheKey}`);
    return cached;
  }

  try {
    const client = getClient();

    const response = await client.shopping.flightOffersSearch.get({
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: departureDate,
      returnDate: returnDate,
      adults: adults,
      currencyCode: 'GBP',
      max: 5, // Get top 5 cheapest options
      nonStop: false // Include connecting flights for cheaper options
    });

    if (!response.data || response.data.length === 0) {
      return null;
    }

    // Parse the cheapest offer
    const cheapestOffer = response.data[0];
    const result = parseFlightOffer(cheapestOffer, destination);

    cache.set(cacheKey, result);
    return result;

  } catch (error) {
    console.error(`Amadeus API error for ${destination}:`, error.description || error.message);

    // Handle specific error codes
    if (error.response?.statusCode === 401) {
      throw new Error('Amadeus authentication failed - check credentials');
    }

    return null;
  }
}

/**
 * Search for flight inspiration - finds cheapest destinations from origin
 *
 * @param {string} origin - Origin IATA code
 * @returns {Promise<Array>} List of cheap destination offers
 */
async function searchFlightInspiration(origin) {
  const cacheKey = `inspiration:${origin}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const client = getClient();

    const response = await client.shopping.flightDestinations.get({
      origin: origin,
      oneWay: false,
      duration: '3,5', // 3 to 5 night trips
      viewBy: 'DESTINATION'
    });

    if (!response.data) {
      return [];
    }

    const results = response.data.map(item => ({
      destination: item.destination,
      departureDate: item.departureDate,
      returnDate: item.returnDate,
      price: parseFloat(item.price.total),
      currency: item.price.currency || 'GBP'
    }));

    cache.set(cacheKey, results);
    return results;

  } catch (error) {
    console.error('Flight inspiration error:', error.description || error.message);
    return [];
  }
}

/**
 * Parse Amadeus flight offer into clean format
 */
function parseFlightOffer(offer, destination) {
  const outbound = offer.itineraries[0];
  const inbound = offer.itineraries[1];

  // Get airline codes
  const outboundCarriers = outbound.segments.map(s => s.carrierCode);
  const inboundCarriers = inbound ? inbound.segments.map(s => s.carrierCode) : [];
  const allCarriers = [...new Set([...outboundCarriers, ...inboundCarriers])];

  return {
    destination: destination,
    price: parseFloat(offer.price.total),
    currency: offer.price.currency,
    outboundDate: outbound.segments[0].departure.at.split('T')[0],
    returnDate: inbound ? inbound.segments[inbound.segments.length - 1].arrival.at.split('T')[0] : null,
    outboundDeparture: outbound.segments[0].departure.at,
    outboundArrival: outbound.segments[outbound.segments.length - 1].arrival.at,
    inboundDeparture: inbound ? inbound.segments[0].departure.at : null,
    inboundArrival: inbound ? inbound.segments[inbound.segments.length - 1].arrival.at : null,
    outboundStops: outbound.segments.length - 1,
    inboundStops: inbound ? inbound.segments.length - 1 : 0,
    airlines: allCarriers,
    duration: {
      outbound: outbound.duration,
      inbound: inbound ? inbound.duration : null
    },
    bookingClass: offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || 'ECONOMY',
    validatingAirline: offer.validatingAirlineCodes?.[0] || allCarriers[0],
    numberOfBookableSeats: offer.numberOfBookableSeats,
    lastTicketingDate: offer.lastTicketingDate
  };
}

/**
 * Generate search dates for the next 6 months
 * Returns pairs of outbound/return dates for 3-5 night stays
 */
function generateSearchDates() {
  const dates = [];
  const now = new Date();

  // Start from 2 weeks ahead, search up to 6 months
  for (let weekOffset = 2; weekOffset <= 24; weekOffset += 2) {
    const outbound = new Date(now);
    outbound.setDate(outbound.getDate() + (weekOffset * 7));

    // Try different stay lengths
    for (const nights of [3, 4, 5]) {
      const returnDate = new Date(outbound);
      returnDate.setDate(returnDate.getDate() + nights);

      dates.push({
        outbound: outbound.toISOString().split('T')[0],
        return: returnDate.toISOString().split('T')[0],
        nights: nights
      });
    }
  }

  return dates;
}

module.exports = {
  searchFlights,
  searchFlightInspiration,
  generateSearchDates
};
