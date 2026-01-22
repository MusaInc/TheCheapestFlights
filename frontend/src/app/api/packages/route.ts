import { NextResponse } from 'next/server';
import type { PackageDeal, PackageSearchParams } from '@/lib/types';

// --- CONFIGURATION ---
// I have set this to TRUE so your app works immediately (bypassing the quota error)
const USE_MOCK_DATA = true; 

// Mock Destinations
const DESTINATIONS: Record<string, string[]> = {
  romantic: ['Paris, France', 'Venice, Italy', 'Santorini, Greece', 'Kyoto, Japan'],
  city: ['New York, USA', 'Tokyo, Japan', 'Dubai, UAE', 'Singapore'],
  adventure: ['Reykjavik, Iceland', 'Queenstown, New Zealand', 'Banff, Canada'],
  chill: ['Bali, Indonesia', 'Phuket, Thailand', 'Cancun, Mexico'],
  random: ['Barcelona, Spain', 'Amsterdam, Netherlands', 'Lisbon, Portugal', 'Istanbul, Turkey']
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

// --- MOCK DATA GENERATOR (Realistic Fake Data) ---
const generateMockDeals = (city: string, country: string, params: PackageSearchParams): PackageDeal[] => {
  // Random "base" price for the city to make it look real
  const basePrice = city.length * 50 + 200; 
  
  return Array.from({ length: 8 }).map((_, i) => {
    const flightPrice = 120;
    // Vary hotel price slightly
    const hotelPrice = basePrice + (i * 85) + Math.floor(Math.random() * 50);
    const totalPrice = flightPrice + hotelPrice;
    
    // Select a realistic image based on index
    const images = [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80'
    ];
    const image = images[i % images.length];

    return {
      id: `mock_${city}_${i}`,
      city: city.split(',')[0],
      country: country,
      iata: 'MOCK',
      lat: 48.8566 + (Math.random() * 0.05),
      lng: 2.3522 + (Math.random() * 0.05),
      nights: params.nights,
      adults: params.adults,
      totalPrice: totalPrice,
      currency: 'GBP',
      priceBreakdown: { flight: flightPrice, hotel: hotelPrice },
      searchedAt: new Date().toISOString(),
      validUntil: null,
      hotel: {
        id: `h_${i}`,
        name: `${city} Luxury Stay ${i + 1}`,
        image: image,
        rating: 8.5 + (Math.random() * 2.3),
        price: hotelPrice,
        bookingLink: 'https://www.booking.com', // Fake link
        address: `City Center, ${city}`,
        priceRange: { min: hotelPrice, max: hotelPrice, average: hotelPrice }
      },
      flight: {
        price: flightPrice,
        currency: 'GBP',
        outboundDate: '2025-05-01',
        returnDate: '2025-05-05',
        outboundDeparture: '08:00',
        outboundArrival: '10:30',
        outboundStops: 0,
        inboundStops: 0,
        airlines: ['British Airways'],
        validatingAirline: 'BA',
        duration: { outbound: '2h 30m', inbound: '2h 30m' }
      }
    };
  });
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Parse Params
  const params: PackageSearchParams = {
    origin: searchParams.get('origin') || 'LON',
    maxBudget: Number(searchParams.get('maxBudget')) || 2000,
    nights: Number(searchParams.get('nights')) || 4,
    adults: Number(searchParams.get('adults')) || 2,
    mood: (searchParams.get('mood') as any) || 'random',
  };

  const { checkin_date, checkout_date } = getDates(params.nights);

  try {
    // Pick Destination
    const explicitDestination = searchParams.get('destination');
    let destinationQuery = '';
    
    if (explicitDestination) {
        destinationQuery = explicitDestination;
    } else {
        const moodList = DESTINATIONS[params.mood] || DESTINATIONS['random'];
        destinationQuery = moodList[Math.floor(Math.random() * moodList.length)];
    }

    console.log(`🔎 Searching: ${destinationQuery} (Mock Mode: ${USE_MOCK_DATA})`);

    // --- MOCK DATA PATH (Bypasses Quota Error) ---
    if (USE_MOCK_DATA) {
        // Simulate network delay so it feels real
        await new Promise(resolve => setTimeout(resolve, 800));

        const mockDeals = generateMockDeals(destinationQuery, 'MockLand', params);
        
        // Filter logic
        let finalDeals = mockDeals.filter(d => d.totalPrice <= params.maxBudget);
        let exactMatch = true;
        let disclaimer = `Mock Results for ${destinationQuery}`;

        if (finalDeals.length === 0) {
            finalDeals = mockDeals.slice(0, 3);
            exactMatch = false;
            disclaimer = "Mock fallback options (Budget too low)";
        }

        return NextResponse.json({
            success: true,
            count: finalDeals.length,
            data: finalDeals,
            searchParams: params,
            exactMatch,
            disclaimer,
        });
    }

    // --- REAL API PATH (Currently Blocked by Quota) ---
    const API_HOST = process.env.RAPIDAPI_HOST;
    const API_KEY = process.env.RAPIDAPI_KEY;

    if (!API_HOST || !API_KEY) throw new Error("Missing API Keys");

    // 1. Get Location
    const locationUrl = `https://${API_HOST}/api/v1/hotels/searchDestination?query=${encodeURIComponent(destinationQuery)}`;
    const locationRes = await fetch(locationUrl, { headers: { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': API_HOST } });
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
    const hotelRaw = await hotelRes.json();
    const hotels = hotelRaw.data?.hotels || [];

    // 3. Process Real Deals
    const flightPrice = 120;
    const allDeals: PackageDeal[] = hotels.slice(0, 15).map((hotel: any) => {
        const hotelPrice = hotel.property.priceBreakdown?.grossPrice?.value || 0;
        return {
          id: `pkg_${hotel.property.id}`,
          city: destinationQuery.split(',')[0],
          country: hotel.property.countryCode || 'XX',
          iata: 'AIR',
          lat: lat, lng: lng,
          nights: params.nights, adults: params.adults,
          totalPrice: Math.round(flightPrice + hotelPrice),
          currency: 'GBP',
          priceBreakdown: { flight: flightPrice, hotel: Math.round(hotelPrice) },
          searchedAt: new Date().toISOString(),
          validUntil: null,
          hotel: {
            id: String(hotel.property.id),
            name: hotel.property.name,
            image: hotel.property.photoUrls?.[0] || '',
            rating: hotel.property.reviewScore || 0,
            price: Math.round(hotelPrice),
            bookingLink: `https://www.booking.com/hotel/${hotel.property.countryCode}/${hotel.property.name}.html`,
            address: hotel.property.wishlistName || destinationQuery,
            priceRange: { min: hotelPrice, max: hotelPrice, average: hotelPrice }
          },
          flight: {
            price: flightPrice,
            currency: 'GBP',
            outboundDate: checkin_date,
            returnDate: checkout_date,
            outboundDeparture: '08:00',
            outboundArrival: '10:20',
            outboundStops: 0,
            inboundStops: 0,
            airlines: ['British Airways'],
            validatingAirline: 'BA',
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