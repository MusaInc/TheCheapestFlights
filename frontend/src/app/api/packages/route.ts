import { NextResponse } from 'next/server';
import { getKlookHotelLink } from '../../../lib/klookHotels';
import type { PackageDeal, PackageSearchParams } from '../../../lib/types';

// --- CONFIGURATION ---
// Set USE_MOCK_DATA=true (or NEXT_PUBLIC_USE_MOCK_DATA=true) to force mock results.
const FORCE_MOCK_DATA =
  process.env.USE_MOCK_DATA === 'true' || process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
const ALLOW_MOCK_FALLBACK = process.env.ALLOW_MOCK_FALLBACK !== 'false';

const BACKEND_BASE_URL = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001')
  .replace(/\/+$/, '');
const BACKEND_TIMEOUT_MS = Number.parseInt(process.env.BACKEND_TIMEOUT_MS || '4000', 10);

const VALID_MOODS = new Set(['romantic', 'city', 'adventure', 'chill', 'random', 'sun', 'train']);
const VALID_TRANSPORT_TYPES = new Set(['flight', 'train', 'any']);

const toPositiveInt = (
  value: string | null,
  fallback: number,
  { min = 0, max }: { min?: number; max?: number } = {}
) => {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed)) return fallback;
  const clamped = Math.max(min, parsed);
  return typeof max === 'number' ? Math.min(clamped, max) : clamped;
};

// Mock Destinations
const DESTINATIONS: Record<string, string[]> = {
  romantic: ['Paris, France', 'Venice, Italy', 'Santorini, Greece', 'Kyoto, Japan'],
  city: ['New York, USA', 'Tokyo, Japan', 'Dubai, UAE', 'Singapore'],
  adventure: ['Reykjavik, Iceland', 'Queenstown, New Zealand', 'Banff, Canada'],
  chill: ['Bali, Indonesia', 'Phuket, Thailand', 'Cancun, Mexico'],
  sun: ['Barcelona, Spain', 'Lisbon, Portugal', 'Nice, France', 'Palma, Spain'],
  random: ['Barcelona, Spain', 'Amsterdam, Netherlands', 'Lisbon, Portugal', 'Istanbul, Turkey']
};

const TRAIN_FRIENDLY = new Set(['Paris', 'Amsterdam', 'Brussels', 'Lyon', 'Nice', 'Milan', 'Barcelona']);

const DESTINATION_COORDS: Record<string, { lat: number; lng: number }> = {
  Paris: { lat: 48.8566, lng: 2.3522 },
  Venice: { lat: 45.4408, lng: 12.3155 },
  Santorini: { lat: 36.3932, lng: 25.4615 },
  Kyoto: { lat: 35.0116, lng: 135.7681 },
  'New York': { lat: 40.7128, lng: -74.006 },
  Tokyo: { lat: 35.6762, lng: 139.6503 },
  Dubai: { lat: 25.2048, lng: 55.2708 },
  Singapore: { lat: 1.3521, lng: 103.8198 },
  Reykjavik: { lat: 64.1466, lng: -21.9426 },
  Queenstown: { lat: -45.0312, lng: 168.6626 },
  Banff: { lat: 51.1784, lng: -115.5708 },
  Bali: { lat: -8.3405, lng: 115.092 },
  Phuket: { lat: 7.8804, lng: 98.3923 },
  Cancun: { lat: 21.1619, lng: -86.8515 },
  Barcelona: { lat: 41.3851, lng: 2.1734 },
  Lisbon: { lat: 38.7223, lng: -9.1393 },
  Nice: { lat: 43.7102, lng: 7.262 },
  Palma: { lat: 39.5696, lng: 2.6502 },
  Amsterdam: { lat: 52.3676, lng: 4.9041 },
  Istanbul: { lat: 41.0082, lng: 28.9784 }
};

const jitter = (value: number, amount: number) => value + (Math.random() - 0.5) * amount;

const resolveCoords = (city: string) => {
  const coords = DESTINATION_COORDS[city];
  if (coords) {
    return { lat: jitter(coords.lat, 0.15), lng: jitter(coords.lng, 0.15) };
  }
  return { lat: jitter(48.8566, 6), lng: jitter(2.3522, 10) };
};

const getDates = (nights: number) => {
  const today = new Date();
  const checkIn = new Date(today);
  checkIn.setDate(today.getDate() + 21); // Booking 3 weeks out
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkIn.getDate() + nights);
  return {
    checkin_date: checkIn.toISOString().split('T')[0],
    checkout_date: checkOut.toISOString().split('T')[0],
  };
};

// Klook affiliate base URL (used for add-ons)
const KLOOK_AFFILIATE_BASE = process.env.KLOOK_AFFILIATE_URL || 'https://klook.tpx.lu/89cfHZHx';

const buildBookingSearchUrl = (city: string, checkin: string, checkout: string, adults = 2) => {
  const params = new URLSearchParams({
    ss: city,
    checkin,
    checkout,
    group_adults: adults.toString(),
    no_rooms: '1',
    group_children: '0',
    sb_travel_purpose: 'leisure'
  });
  return `https://www.booking.com/searchresults.html?${params.toString()}`;
};

const buildGoogleFlightsUrl = (origin: string, destination: string, departureDate: string, returnDate: string) => {
  const query = `Flights from ${origin} to ${destination} on ${departureDate} through ${returnDate}`;
  const params = new URLSearchParams({
    hl: 'en-GB',
    gl: 'uk',
    curr: 'GBP'
  });
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(query)}&${params.toString()}`;
};

const buildKlookTrainUrl = (origin: string, destination: string, departureDate: string, returnDate: string) => {
  const params = new URLSearchParams({
    from: origin.toLowerCase(),
    to: destination.toLowerCase(),
    outbound: departureDate,
    return: returnDate
  });
  return `${KLOOK_AFFILIATE_BASE}?${params.toString()}`;
};

const buildBackendQuery = (params: PackageSearchParams, rawParams: URLSearchParams) => {
  const query = new URLSearchParams({
    origin: params.origin,
    maxBudget: params.maxBudget.toString(),
    nights: params.nights.toString(),
    adults: params.adults.toString(),
    mood: params.mood,
    transportType: params.transportType || 'any'
  });

  const departureDate = rawParams.get('departureDate');
  const returnDate = rawParams.get('returnDate');
  if (departureDate) query.set('departureDate', departureDate);
  if (returnDate) query.set('returnDate', returnDate);
  if (rawParams.get('debug') === 'true') query.set('debug', 'true');
  return query;
};

const pickDestinations = (list: string[], count: number) => {
  const shuffled = [...list].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, list.length));
};

const resolveTransportType = (city: string, desired: PackageSearchParams['transportType']) => {
  if (desired === 'train') return 'train';
  if (desired === 'flight') return 'flight';
  return TRAIN_FRIENDLY.has(city) ? 'train' : 'flight';
};

const buildTransport = (
  transportType: 'flight' | 'train',
  price: number,
  checkin: string,
  checkout: string,
  origin: string,
  destination: string
) => {
  const isTrain = transportType === 'train';
  return {
    type: transportType,
    price,
    currency: 'GBP',
    outboundDate: checkin,
    returnDate: checkout,
    outboundDeparture: `${checkin}T08:00:00`,
    outboundArrival: `${checkin}T10:30:00`,
    outboundStops: 0,
    inboundStops: 0,
    carriers: isTrain ? ['Eurostar'] : ['British Airways'],
    validatingCarrier: isTrain ? 'Eurostar' : 'BA',
    duration: {
      outbound: isTrain ? '2h 40m' : '2h 20m',
      inbound: isTrain ? '2h 40m' : '2h 20m'
    },
    bookingLink: isTrain
      ? buildKlookTrainUrl(origin, destination, checkin, checkout)
      : buildGoogleFlightsUrl(origin, destination, checkin, checkout),
    isDirect: true,
    trainTypes: isTrain ? ['eurostar'] : null
  };
};

const fetchBackendPackages = async (params: PackageSearchParams, rawParams: URLSearchParams) => {
  const controller = new AbortController();
  const timeout = Number.isFinite(BACKEND_TIMEOUT_MS) && BACKEND_TIMEOUT_MS > 0 ? BACKEND_TIMEOUT_MS : 4000;
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const query = buildBackendQuery(params, rawParams);
    const response = await fetch(`${BACKEND_BASE_URL}/api/packages/search?${query.toString()}`, {
      signal: controller.signal,
      cache: 'no-store'
    });
    if (!response.ok) {
      throw new Error(`Backend search failed: ${response.status}`);
    }
    return await response.json();
  } catch (error: any) {
    console.warn('Backend search failed:', error.message);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
};

// --- MOCK DATA GENERATOR (Realistic Fake Data) ---
const generateMockDeals = (
  destinationLabel: string,
  params: PackageSearchParams,
  checkin: string,
  checkout: string,
  count = 3
): PackageDeal[] => {
  const [cityRaw, countryRaw] = destinationLabel.split(',');
  const city = cityRaw?.trim() || destinationLabel;
  const country = countryRaw?.trim() || 'Unknown';
  const coords = resolveCoords(city);
  const transportType = resolveTransportType(city, params.transportType || 'any');
  // Random "base" price for the city to make it look real
  const basePrice = city.length * 50 + 200; 
  
  return Array.from({ length: count }).map((_, i) => {
    const transportPrice = transportType === 'train' ? 95 + i * 12 : 120 + i * 15;
    // Vary hotel price slightly
    const hotelPrice = basePrice + (i * 85) + Math.floor(Math.random() * 50);
    const totalPrice = transportPrice + hotelPrice;
    
    // Select a realistic image based on index
    const images = [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80'
    ];
    const image = images[i % images.length];

    const transport = buildTransport(transportType, transportPrice, checkin, checkout, params.origin, city);
    const partnerLink = getKlookHotelLink(city);
    const bookingLink = buildBookingSearchUrl(city, checkin, checkout, params.adults);

    return {
      id: `mock_${city}_${i}`,
      city: city.split(',')[0],
      country: country,
      iata: 'MOCK',
      lat: coords.lat,
      lng: coords.lng,
      nights: params.nights,
      adults: params.adults,
      transportType,
      transport,
      totalPrice: totalPrice,
      currency: 'GBP',
      priceBreakdown: {
        transport: transportPrice,
        flight: transportType === 'flight' ? transportPrice : 0,
        train: transportType === 'train' ? transportPrice : 0,
        hotel: hotelPrice
      },
      searchedAt: new Date().toISOString(),
      validUntil: null,
      hotel: {
        id: `h_${i}`,
        name: `${city} Central Hotel`,
        image: image,
        rating: 7.5 + (Math.random() * 2),
        price: hotelPrice,
        bookingLink: bookingLink,
        partnerLink: partnerLink,
        partnerName: partnerLink ? 'Klook' : undefined,
        address: `City Center, ${city}`,
        priceRange: { min: hotelPrice, max: hotelPrice, average: hotelPrice }
      },
      hotelOptions: [
        {
          id: `h_${i}_1`,
          name: `${city} City Inn`,
          image: images[(i + 1) % images.length],
          rating: 7.2 + Math.random() * 0.8,
          price: Math.round(hotelPrice * 0.85),
          bookingLink: bookingLink
        },
        {
          id: `h_${i}_2`,
          name: `Grand ${city} Suites`,
          image: images[(i + 2) % images.length],
          rating: 8.5 + Math.random() * 1,
          price: Math.round(hotelPrice * 1.25),
          bookingLink: bookingLink
        }
      ],
      flight: {
        price: transportType === 'flight' ? transportPrice : 0,
        currency: 'GBP',
        outboundDate: checkin,
        returnDate: checkout,
        outboundDeparture: '08:00',
        outboundArrival: '10:30',
        outboundStops: 0,
        inboundStops: 0,
        airlines: transportType === 'flight' ? ['British Airways'] : [],
        validatingAirline: transportType === 'flight' ? 'BA' : '',
        duration: { outbound: '2h 30m', inbound: '2h 30m' }
      },
      addons: {
        available: true,
        mainLink: KLOOK_AFFILIATE_BASE,
        highlights: [
          { name: `${city} Walking Tour`, type: 'tours', priceFrom: 25, bookingLink: KLOOK_AFFILIATE_BASE },
          { name: 'Skip-the-Line Tickets', type: 'attractions', priceFrom: 20, bookingLink: KLOOK_AFFILIATE_BASE }
        ]
      }
    };
  });
};

const buildMockResponse = (
  params: PackageSearchParams,
  moodList: string[],
  checkin: string,
  checkout: string
) => {
  const destinations = pickDestinations(moodList, 4);
  const deals = destinations.flatMap((dest) => generateMockDeals(dest, params, checkin, checkout, 3));
  let finalDeals = deals.filter((deal) => deal.totalPrice <= params.maxBudget);
  let exactMatch = true;
  let disclaimer = 'Mock results (backend unavailable)';

  if (finalDeals.length === 0) {
    finalDeals = deals.slice(0, 6);
    exactMatch = false;
    disclaimer = 'Mock fallback options (Budget too low)';
  }

  return NextResponse.json({
    success: true,
    count: finalDeals.length,
    data: finalDeals,
    searchParams: params,
    exactMatch,
    disclaimer
  });
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Parse Params
  const rawMood = (searchParams.get('mood') || 'random').toLowerCase();
  const mood = VALID_MOODS.has(rawMood) ? (rawMood as PackageSearchParams['mood']) : 'random';
  const rawTransportType = (searchParams.get('transportType') || 'any').toLowerCase();
  const transportType = VALID_TRANSPORT_TYPES.has(rawTransportType) ? (rawTransportType as 'flight' | 'train' | 'any') : 'any';
  const params: PackageSearchParams = {
    origin: searchParams.get('origin') || 'LON',
    maxBudget: toPositiveInt(searchParams.get('maxBudget'), 2000, { min: 0 }),
    nights: toPositiveInt(searchParams.get('nights'), 4, { min: 1, max: 28 }),
    adults: toPositiveInt(searchParams.get('adults'), 2, { min: 1, max: 9 }),
    mood,
    transportType
  };

  const { checkin_date, checkout_date } = getDates(params.nights);
  const moodList = DESTINATIONS[params.mood] || DESTINATIONS['random'];
  const explicitDestination = searchParams.get('destination');
  const mockDestinationList = explicitDestination ? [explicitDestination] : moodList;

  try {
    if (!FORCE_MOCK_DATA) {
      const backendResult = await fetchBackendPackages(params, searchParams);
      if (backendResult) {
        return NextResponse.json(backendResult);
      }
      if (ALLOW_MOCK_FALLBACK && !(process.env.RAPIDAPI_HOST && process.env.RAPIDAPI_KEY)) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return buildMockResponse(params, mockDestinationList, checkin_date, checkout_date);
      }
    }

    // Pick Destination
    let destinationQuery = '';
    
    if (explicitDestination) {
        destinationQuery = explicitDestination;
    } else {
        destinationQuery = moodList[Math.floor(Math.random() * moodList.length)];
    }

    console.log(`🔎 Searching: ${destinationQuery} (Mock Mode: ${FORCE_MOCK_DATA})`);

    // --- MOCK DATA PATH (Forced) ---
    if (FORCE_MOCK_DATA) {
        // Simulate network delay so it feels real
        await new Promise(resolve => setTimeout(resolve, 800));

        return buildMockResponse(params, mockDestinationList, checkin_date, checkout_date);
    }

    // --- REAL API PATH (Currently Blocked by Quota) ---
    const API_HOST = process.env.RAPIDAPI_HOST;
    const API_KEY = process.env.RAPIDAPI_KEY;

    if (!API_HOST || !API_KEY) {
      throw new Error('Backend unavailable and RapidAPI keys missing');
    }

    // 1. Get Location
    const locationUrl = `https://${API_HOST}/api/v1/hotels/searchDestination?query=${encodeURIComponent(destinationQuery)}`;
    const locationRes = await fetch(locationUrl, { headers: { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': API_HOST } });
    if (!locationRes.ok) {
        throw new Error(`Location lookup failed: ${locationRes.status}`);
    }
    const locationRaw = await locationRes.json();
    
    // Check for Quota Error in response
    if (locationRaw.message && locationRaw.message.includes('quota')) {
        throw new Error("RapidAPI Quota Exceeded. Switch USE_MOCK_DATA to true in route.ts");
    }

    const locationData = locationRaw.data || [];
    if (!locationData || locationData.length === 0) throw new Error(`Could not find location ID for "${destinationQuery}"`);

    const destId = locationData[0].dest_id;
    const searchType = locationData[0].search_type;
    const lat = parseFloat(locationData[0].latitude);
    const lng = parseFloat(locationData[0].longitude);

    // 2. Get Hotels
    const hotelUrl = `https://${API_HOST}/api/v1/hotels/searchHotels?dest_id=${destId}&search_type=${searchType}&arrival_date=${checkin_date}&departure_date=${checkout_date}&adults=${params.adults}&room_qty=1&page_number=1&currency_code=GBP&sort_by=price`;
    const hotelRes = await fetch(hotelUrl, { headers: { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': API_HOST } });
    if (!hotelRes.ok) {
        throw new Error(`Hotel search failed: ${hotelRes.status}`);
    }
    const hotelRaw = await hotelRes.json();
    const hotels = hotelRaw.data?.hotels || [];

    // 3. Process Real Deals
    const cityName = destinationQuery.split(',')[0];
    const transportType = resolveTransportType(cityName, params.transportType || 'any');
    const transportPrice = transportType === 'train' ? 95 : 120;
    const transport = buildTransport(transportType, transportPrice, checkin_date, checkout_date, params.origin, cityName);
    const partnerLink = getKlookHotelLink(cityName);
    const allDeals: PackageDeal[] = hotels.slice(0, 25).map((hotel: any) => {
        const hotelPrice = hotel.property.priceBreakdown?.grossPrice?.value || 0;
        const bookingLink =
          hotel.property?.url ||
          hotel.property?.hotelUrl ||
          buildBookingSearchUrl(cityName, checkin_date, checkout_date, params.adults);
        return {
          id: `pkg_${hotel.property.id}`,
          city: cityName,
          country: hotel.property.countryCode || 'XX',
          iata: 'AIR',
          lat: lat, lng: lng,
          nights: params.nights, adults: params.adults,
          transportType,
          transport,
          totalPrice: Math.round(transportPrice + hotelPrice),
          currency: 'GBP',
          priceBreakdown: {
            transport: transportPrice,
            flight: transportType === 'flight' ? transportPrice : 0,
            train: transportType === 'train' ? transportPrice : 0,
            hotel: Math.round(hotelPrice)
          },
          searchedAt: new Date().toISOString(),
          validUntil: null,
          hotel: {
            id: String(hotel.property.id),
            name: hotel.property.name,
            image: hotel.property.photoUrls?.[0] || '',
            rating: hotel.property.reviewScore || 0,
            price: Math.round(hotelPrice),
            bookingLink,
            partnerLink: partnerLink,
            partnerName: partnerLink ? 'Klook' : undefined,
            address: hotel.property.wishlistName || destinationQuery,
            priceRange: { min: hotelPrice, max: hotelPrice, average: hotelPrice }
          },
          flight: {
            price: transportType === 'flight' ? transportPrice : 0,
            currency: 'GBP',
            outboundDate: checkin_date,
            returnDate: checkout_date,
            outboundDeparture: '08:00',
            outboundArrival: '10:20',
            outboundStops: 0,
            inboundStops: 0,
            airlines: transportType === 'flight' ? ['British Airways'] : [],
            validatingAirline: transportType === 'flight' ? 'BA' : '',
            duration: { outbound: '2h 15m', inbound: '2h 15m' },
          },
        };
    });

    let finalDeals = allDeals.filter(d => d.totalPrice <= params.maxBudget);
    let exactMatch = true;
    let disclaimer = `Live rates for ${destinationQuery}`;

    if (finalDeals.length === 0 && allDeals.length > 0) {
        finalDeals = allDeals.sort((a, b) => a.totalPrice - b.totalPrice).slice(0, 6);
        exactMatch = false;
        disclaimer = `Closest matches to your budget.`;
    }

    return NextResponse.json({
      success: true,
      count: finalDeals.length,
      data: finalDeals,
      searchParams: params,
      exactMatch,
      disclaimer,
    });

  } catch (error: any) {
    console.error('API ERROR:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
