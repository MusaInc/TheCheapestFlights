/**
 * Hotel Service
 *
 * Integrates with Booking.com Affiliate Partner API for real hotel data.
 *
 * IMPORTANT: This requires Booking.com Affiliate Partner approval.
 * Apply at: https://www.booking.com/affiliate-program/v2/index.html
 *
 * Until approved, this service returns placeholder structure that
 * will work with real data once credentials are provided.
 *
 * The affiliate deep links are generated correctly regardless.
 */

const NodeCache = require('node-cache');

// Cache hotel results for 30 minutes
const cache = new NodeCache({ stdTTL: 1800, checkperiod: 300 });

// Booking.com affiliate link template
// This works without API access - just needs affiliate ID
const BOOKING_AFFILIATE_BASE = 'https://www.booking.com/searchresults.html';

/**
 * Search for hotels in a city
 *
 * @param {string} city - City name
 * @param {string} checkin - Check-in date YYYY-MM-DD
 * @param {string} checkout - Check-out date YYYY-MM-DD
 * @param {number} adults - Number of adults
 * @returns {Promise<Object>} Hotel search results
 */
async function searchHotels(city, checkin, checkout, adults = 2) {
  const cacheKey = `hotels:${city}:${checkin}:${checkout}:${adults}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Generate affiliate search link (works without API)
  const affiliateId = process.env.BOOKING_AFFILIATE_ID || '';
  const searchUrl = generateBookingSearchUrl(city, checkin, checkout, adults, affiliateId);

  /**
   * BOOKING.COM AFFILIATE API INTEGRATION
   *
   * When you have Booking.com Affiliate API access, replace this section with:
   *
   * const response = await fetch('https://distribution-xml.booking.com/2.x/json/hotels', {
   *   headers: {
   *     'Authorization': `Basic ${Buffer.from(`${BOOKING_USERNAME}:${BOOKING_PASSWORD}`).toString('base64')}`
   *   },
   *   params: {
   *     city_ids: CITY_ID,
   *     checkin: checkin,
   *     checkout: checkout,
   *     guest_qty: adults,
   *     room_qty: 1,
   *     rows: 10,
   *     order_by: 'price'
   *   }
   * });
   *
   * For now, we return the search URL which is fully functional for affiliate linking.
   */

  // Calculate nights
  const checkinDate = new Date(checkin);
  const checkoutDate = new Date(checkout);
  const nights = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));

  // Return structure with booking link
  // This is the minimum viable response that enables affiliate revenue
  const result = {
    city: city,
    checkin: checkin,
    checkout: checkout,
    nights: nights,
    adults: adults,
    searchUrl: searchUrl,
    // Placeholder for when API access is available
    hotels: null,
    // Estimated price range based on city tier
    estimatedPricePerNight: getEstimatedPrice(city),
    disclaimer: 'Prices shown on Booking.com. Subject to availability.'
  };

  cache.set(cacheKey, result);
  return result;
}

/**
 * Generate Booking.com affiliate search URL
 *
 * This is the core affiliate functionality - works without API access.
 * Users click through to Booking.com with tracking, we earn commission.
 */
function generateBookingSearchUrl(city, checkin, checkout, adults, affiliateId) {
  const params = new URLSearchParams({
    ss: city,
    checkin: checkin,
    checkout: checkout,
    group_adults: adults.toString(),
    no_rooms: '1',
    group_children: '0',
    sb_travel_purpose: 'leisure',
    // Affiliate tracking
    aid: affiliateId || '',
    // Sort by price
    order: 'price'
  });

  return `${BOOKING_AFFILIATE_BASE}?${params.toString()}`;
}

/**
 * Generate direct hotel booking link with affiliate tracking
 */
function generateHotelDeepLink(hotelId, checkin, checkout, affiliateId) {
  const params = new URLSearchParams({
    checkin: checkin,
    checkout: checkout,
    aid: affiliateId || ''
  });

  return `https://www.booking.com/hotel/${hotelId}.html?${params.toString()}`;
}

/**
 * Get estimated price per night based on city tier
 * This is used when real API data isn't available
 */
function getEstimatedPrice(city) {
  const expensiveCities = ['Paris', 'Amsterdam', 'Copenhagen', 'Stockholm', 'Venice'];
  const midRangeCities = ['Barcelona', 'Madrid', 'Rome', 'Berlin', 'Vienna', 'Prague', 'Lisbon'];
  const budgetCities = ['Krakow', 'Budapest', 'Riga', 'Tallinn', 'Vilnius', 'Warsaw'];

  if (expensiveCities.includes(city)) {
    return { min: 80, max: 150 };
  } else if (midRangeCities.includes(city)) {
    return { min: 50, max: 100 };
  } else if (budgetCities.includes(city)) {
    return { min: 30, max: 70 };
  }

  return { min: 40, max: 90 }; // Default
}

/**
 * Calculate total estimated hotel cost
 */
function calculateHotelEstimate(city, nights) {
  const priceRange = getEstimatedPrice(city);
  return {
    min: priceRange.min * nights,
    max: priceRange.max * nights,
    average: Math.round(((priceRange.min + priceRange.max) / 2) * nights)
  };
}

module.exports = {
  searchHotels,
  generateBookingSearchUrl,
  generateHotelDeepLink,
  getEstimatedPrice,
  calculateHotelEstimate
};
