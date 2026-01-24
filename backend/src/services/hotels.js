/**
 * Hotel Service
 *
 * Uses Amadeus Hotel Search API for real hotel data.
 * Falls back to Klook affiliate links for booking.
 */

const Amadeus = require('amadeus');
const NodeCache = require('node-cache');

// Cache hotel results for 30 minutes
const cache = new NodeCache({ stdTTL: 1800, checkperiod: 300 });

// Klook affiliate base URL for booking links
const KLOOK_AFFILIATE_BASE = process.env.KLOOK_AFFILIATE_URL || 'https://klook.tpx.lu/89cfHZHx';

// City to IATA code mapping for Amadeus
const CITY_CODES = {
  'Paris': 'PAR',
  'London': 'LON',
  'Barcelona': 'BCN',
  'Rome': 'ROM',
  'Amsterdam': 'AMS',
  'Berlin': 'BER',
  'Prague': 'PRG',
  'Vienna': 'VIE',
  'Budapest': 'BUD',
  'Lisbon': 'LIS',
  'Madrid': 'MAD',
  'Milan': 'MIL',
  'Venice': 'VCE',
  'Brussels': 'BRU',
  'Munich': 'MUC',
  'Nice': 'NCE',
  'Athens': 'ATH',
  'Dubrovnik': 'DBV',
  'Copenhagen': 'CPH',
  'Stockholm': 'STO',
  'Krakow': 'KRK',
  'Naples': 'NAP',
  'Porto': 'OPO',
  'Split': 'SPU',
  'Malaga': 'AGP',
  'Seville': 'SVQ',
  'Valencia': 'VLC',
  'Lyon': 'LYS',
  'Palma': 'PMI',
  'Tenerife': 'TFS',
  'Alicante': 'ALC',
  'Faro': 'FAO',
  'Cologne': 'CGN',
  'Warsaw': 'WAW',
  'Riga': 'RIX',
  'Tallinn': 'TLL',
  'Vilnius': 'VNO'
};

// Initialize Amadeus client
let amadeus = null;

function getClient() {
  if (!amadeus) {
    if (!process.env.AMADEUS_CLIENT_ID || !process.env.AMADEUS_CLIENT_SECRET) {
      return null;
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
 * Generate Klook hotel search URL
 */
function generateKlookHotelUrl(city) {
  const citySlug = city.toLowerCase().replace(/\s+/g, '-');
  return `${KLOOK_AFFILIATE_BASE}?city=${citySlug}`;
}

/**
 * Search for hotels using Amadeus API
 */
async function searchHotels(city, checkin, checkout, adults = 2) {
  const cacheKey = `hotels:${city}:${checkin}:${checkout}:${adults}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log(`Hotel cache hit: ${cacheKey}`);
    return cached;
  }

  const checkinDate = new Date(checkin);
  const checkoutDate = new Date(checkout);
  const nights = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
  const klookUrl = generateKlookHotelUrl(city);

  // Try Amadeus API first
  const client = getClient();
  if (client) {
    try {
      const hotels = await fetchAmadeusHotels(client, city, checkin, checkout, adults, klookUrl);
      if (hotels && hotels.length > 0) {
        const result = {
          city,
          checkin,
          checkout,
          nights,
          adults,
          searchUrl: klookUrl,
          hotels,
          source: 'amadeus',
          isEstimate: false,
          disclaimer: 'Real-time prices. Book on Klook for best rates.'
        };
        cache.set(cacheKey, result);
        return result;
      }
    } catch (error) {
      console.warn('Amadeus hotel search failed:', error.message);
    }
  }

  // Fallback to estimates
  const priceRange = getEstimatedPrice(city);
  const basePrice = priceRange.min * nights;
  const hotels = generateFallbackHotels(city, nights, basePrice, klookUrl);

  const result = {
    city,
    checkin,
    checkout,
    nights,
    adults,
    searchUrl: klookUrl,
    hotels,
    source: 'estimate',
    isEstimate: true,
    estimatedPricePerNight: priceRange,
    disclaimer: 'Estimated prices. Check Klook for live availability.'
  };

  cache.set(cacheKey, result);
  return result;
}

/**
 * Fetch hotels from Amadeus API
 */
async function fetchAmadeusHotels(client, city, checkin, checkout, adults, klookUrl) {
  const cityCode = CITY_CODES[city];
  if (!cityCode) {
    console.log(`No city code for ${city}, skipping Amadeus`);
    return null;
  }

  // Step 1: Get hotel IDs in the city
  console.log(`Searching hotels in ${city} (${cityCode})...`);

  const hotelListResponse = await client.referenceData.locations.hotels.byCity.get({
    cityCode: cityCode,
    radius: 10,
    radiusUnit: 'KM',
    hotelSource: 'ALL'
  });

  if (!hotelListResponse.data || hotelListResponse.data.length === 0) {
    console.log(`No hotels found in ${city}`);
    return null;
  }

  // Take first 20 hotels
  const hotelIds = hotelListResponse.data.slice(0, 20).map(h => h.hotelId);
  console.log(`Found ${hotelListResponse.data.length} hotels, checking prices for ${hotelIds.length}...`);

  // Step 2: Get offers for these hotels
  const offersResponse = await client.shopping.hotelOffersSearch.get({
    hotelIds: hotelIds.join(','),
    checkInDate: checkin,
    checkOutDate: checkout,
    adults: adults,
    roomQuantity: 1,
    currency: 'GBP',
    bestRateOnly: true
  });

  if (!offersResponse.data || offersResponse.data.length === 0) {
    console.log(`No hotel offers available for dates`);
    return null;
  }

  // Parse hotel offers
  const hotels = offersResponse.data
    .filter(hotel => hotel.offers && hotel.offers.length > 0)
    .map((hotel, index) => {
      const offer = hotel.offers[0];
      const price = parseFloat(offer.price?.total || '0');
      const hotelInfo = hotel.hotel || {};

      return {
        id: hotelInfo.hotelId || `amadeus-${index}`,
        name: hotelInfo.name || `${city} Hotel`,
        image: getHotelImage(hotelInfo, city, index),
        rating: parseRating(hotelInfo.rating),
        price: Math.round(price),
        pricePerNight: Math.round(price / Math.max(1, Math.ceil((new Date(checkout) - new Date(checkin)) / (1000 * 60 * 60 * 24)))),
        bookingLink: klookUrl,
        address: formatAddress(hotelInfo),
        amenities: offer.room?.description?.text || '',
        source: 'amadeus'
      };
    })
    .filter(h => h.price > 0)
    .sort((a, b) => a.price - b.price);

  console.log(`Got ${hotels.length} hotels with prices`);
  return hotels;
}

/**
 * Get hotel image - Amadeus doesn't always provide images
 */
function getHotelImage(hotelInfo, city, index) {
  // Check if Amadeus provides media
  if (hotelInfo.media && hotelInfo.media.length > 0) {
    return hotelInfo.media[0].uri;
  }

  // Fallback to quality stock hotel images
  const fallbackImages = [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80'
  ];

  const hash = city.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return fallbackImages[(hash + index) % fallbackImages.length];
}

/**
 * Parse hotel rating
 */
function parseRating(rating) {
  if (!rating) return 0;
  // Amadeus uses 1-5 stars, convert to 1-10 scale
  const stars = parseInt(rating, 10);
  if (stars >= 1 && stars <= 5) {
    return stars * 2; // 5 stars = 10, 4 stars = 8, etc.
  }
  return 0;
}

/**
 * Format hotel address
 */
function formatAddress(hotelInfo) {
  if (hotelInfo.address) {
    const addr = hotelInfo.address;
    return [addr.lines?.[0], addr.cityName, addr.countryCode]
      .filter(Boolean)
      .join(', ');
  }
  return '';
}

/**
 * Generate fallback hotels when API unavailable
 */
function generateFallbackHotels(city, nights, basePrice, klookUrl) {
  const hotelTypes = [
    { prefix: '', suffix: 'Central Hotel', multiplier: 0.85 },
    { prefix: '', suffix: 'City Inn', multiplier: 0.9 },
    { prefix: 'Hotel ', suffix: '', multiplier: 1.0 },
    { prefix: '', suffix: ' Suites', multiplier: 1.15 },
    { prefix: 'Grand ', suffix: ' Hotel', multiplier: 1.35 }
  ];

  const fallbackImages = [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80'
  ];

  return hotelTypes.map((type, index) => {
    const name = `${type.prefix}${city}${type.suffix}`.trim();
    const price = Math.round(basePrice * type.multiplier);
    const rating = 7 + index * 0.5;

    return {
      id: `fallback-${city.toLowerCase().replace(/\s+/g, '-')}-${index}`,
      name,
      image: fallbackImages[index],
      rating: Math.round(rating * 10) / 10,
      price,
      pricePerNight: Math.round(price / nights),
      bookingLink: klookUrl,
      address: `City Center, ${city}`,
      source: 'estimate'
    };
  });
}

/**
 * Get estimated price per night based on city tier
 */
function getEstimatedPrice(city) {
  const expensiveCities = ['Paris', 'Amsterdam', 'Copenhagen', 'Stockholm', 'Venice', 'Milan', 'Nice'];
  const midRangeCities = ['Barcelona', 'Madrid', 'Rome', 'Berlin', 'Vienna', 'Prague', 'Lisbon', 'Brussels', 'Munich'];
  const budgetCities = ['Krakow', 'Budapest', 'Riga', 'Tallinn', 'Vilnius', 'Warsaw', 'Split', 'Naples'];

  if (expensiveCities.includes(city)) {
    return { min: 75, max: 140 };
  } else if (midRangeCities.includes(city)) {
    return { min: 50, max: 95 };
  } else if (budgetCities.includes(city)) {
    return { min: 30, max: 65 };
  }
  return { min: 45, max: 85 };
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
  generateKlookHotelUrl,
  getEstimatedPrice,
  calculateHotelEstimate,
  KLOOK_AFFILIATE_BASE
};
