import { NextResponse } from 'next/server';
import crypto from 'crypto';
import type { PackageDeal, PackageSearchParams } from '../../../lib/types';

// --- CONFIGURATION ---
const AVIASALES_TOKEN = process.env.AVIASALES_TOKEN || 'YOUR_TOKEN_HERE';
const MARKER = process.env.AVIASALES_MARKER || 'YOUR_MARKER_HERE';
const HOST = 'tickets-api.travelpayouts.com';

// 1. DESTINATIONS
const DESTINATIONS: Record<string, string[]> = {
  romantic: ['PAR', 'VCE', 'ROM', 'JTR', 'KYT'], 
  city: ['NYC', 'TYO', 'DXB', 'SIN', 'BER'],     
  adventure: ['REK', 'ZQN', 'YBA', 'SJO'],        
  chill: ['DPS', 'HKT', 'CUN', 'NAN'],            
  random: ['BCN', 'AMS', 'LIS', 'PRG', 'BUD', 'IST'] 
};

// 2. FALLBACK HUBS
const FALLBACK_HUBS = ['BCN', 'PAR', 'AMS', 'ROM', 'DUB', 'MAD', 'LIS'];

// City Names Mapping
const CITY_NAMES: Record<string, string> = {
  PAR: 'Paris', VCE: 'Venice', ROM: 'Rome', JTR: 'Santorini', KYT: 'Kyoto',
  NYC: 'New York', TYO: 'Tokyo', DXB: 'Dubai', SIN: 'Singapore', BER: 'Berlin',
  REK: 'Reykjavik', ZQN: 'Queenstown', YBA: 'Banff', SJO: 'Costa Rica',
  DPS: 'Bali', HKT: 'Phuket', CUN: 'Cancun', NAN: 'Fiji',
  BCN: 'Barcelona', AMS: 'Amsterdam', LIS: 'Lisbon', PRG: 'Prague', BUD: 'Budapest', IST: 'Istanbul',
  DUB: 'Dublin', MAD: 'Madrid', MIL: 'Milan',
  LON: 'London', MAN: 'Manchester'
};

const getDates = (nights: number) => {
  const today = new Date();
  const checkIn = new Date(today);
  checkIn.setDate(today.getDate() + 45); 
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkIn.getDate() + nights);
  
  return {
    checkin_date: checkIn.toISOString().split('T')[0],
    checkout_date: checkOut.toISOString().split('T')[0],
    month: checkIn.toISOString().slice(0, 7)
  };
};

// --- HELPER: MD5 Signature for Live API ---
function generateSignature(params: any, token: string, marker: string) {
  // Sort keys and join values
  // Note: Simplified signature for search/affiliate/v2 usually requires:
  // md5(token + ':' + marker + ':' + stringified_body)
  // But for 'v1' strict signature is complex. 
  // We will use the V1 Search API which is simpler for affiliates.
  
  // Actually, standard affiliate search relies on Deep Links mostly. 
  // The 'Search API' v1 requires a strict signature:
  // Signature = MD5(token:marker:adults:date:destination:origin:trip_class:user_ip)
  // Let's rely on the CACHED API for reliability unless we can perfectly match the signature.
  return crypto.createHash('md5').update(`${token}:${marker}`).digest('hex');
}

/**
 * STRATEGY 1: LIVE SEARCH (Complex, Slower, Most Accurate)
 * Note: This often gets blocked on localhost.
 */
async function fetchLiveFlights(origin: string, destination: string, date: string, adults: number, clientIp: string) {
    // NOTE: Implementing the full Live Search API requires handling callbacks and strict IP whitelisting.
    // For this demo, we will skip the complex POST/Poll flow and rely on the highly effective
    // "Broad Cached" search which mimics live data by finding the cheapest existing tickets.
    // If you strictly need the POST API, it requires a backend proxy to handle the IP restriction.
    return null; 
}

/**
 * STRATEGY 2: BROAD CACHED SEARCH (Fast, Reliable, "All Data")
 * We fetch "All" prices for the route and filter manually to ensure we don't miss anything.
 */
async function fetchCachedFlights(origin: string, destination: string | null, date: string | null) {
  // We use the "Cheap" endpoint but without date filters to get maximal results
  let url = `https://api.travelpayouts.com/v1/prices/cheap?origin=${origin}&currency=GBP&token=${AVIASALES_TOKEN}`;
  
  if (destination) url += `&destination=${destination}`;
  if (date) url += `&depart_date=${date}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    
    const json = await res.json();
    if (!json.success || !json.data) return [];

    // Flatten results: The API returns { "DEST": { "0": {...}, "1": {...} } }
    let allFlights: any[] = [];
    
    // If specific destination
    if (destination && json.data[destination]) {
        return Object.values(json.data[destination]);
    }
    
    // If "Anywhere" search, flatten all destinations
    Object.keys(json.data).forEach(destCode => {
        const flightsForDest = Object.values(json.data[destCode]);
        const enriched = flightsForDest.map((f: any) => ({ ...f, destination: destCode }));
        allFlights = [...allFlights, ...enriched];
    });

    return allFlights;
  } catch (err) {
    console.error(`Cached fetch failed:`, err);
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // 1. Parse Params
  const params: PackageSearchParams = {
    origin: searchParams.get('origin') || 'LON',
    maxBudget: Number(searchParams.get('maxBudget')) || 2000,
    nights: Number(searchParams.get('nights')) || 4,
    adults: Number(searchParams.get('adults')) || 2,
    mood: (searchParams.get('mood') as any) || 'random',
    transportType: (searchParams.get('transportType') as any) || 'any'
  };

  const { checkin_date, checkout_date, month } = getDates(params.nights);

  try {
    // 2. Determine Target Destination
    const explicitDestination = searchParams.get('destination');
    let targetDestination = '';
    
    if (explicitDestination) {
        targetDestination = explicitDestination.toUpperCase();
    } else {
        const moodList = DESTINATIONS[params.mood] || DESTINATIONS['random'];
        targetDestination = moodList[Math.floor(Math.random() * moodList.length)];
    }

    console.log(`✈️ Search: ${params.origin} -> ${targetDestination} (Month: ${month})`);

    // 3. EXECUTE SEARCH STRATEGY
    // We prioritize getting *some* result over getting *empty* specific results.
    
    // Attempt A: Exact Route, Specific Month
    let validFlights = await fetchCachedFlights(params.origin, targetDestination, month);
    let isFallback = false;
    let fallbackType = '';

    // Attempt B: Exact Route, ANY Month (This usually fixes the "No data" issue)
    if (!validFlights || validFlights.length === 0) {
        console.warn(`⚠️ No data for ${month}. Searching ANY date.`);
        validFlights = await fetchCachedFlights(params.origin, targetDestination, null);
    }

    // Attempt C: Fallback Hub, Specific Month
    if (!validFlights || validFlights.length === 0) {
        const hub = FALLBACK_HUBS[Math.floor(Math.random() * FALLBACK_HUBS.length)];
        console.warn(`⚠️ Route unavailable. Switching to hub: ${hub}`);
        validFlights = await fetchCachedFlights(params.origin, hub, month);
        targetDestination = hub; // Update target for UI
        isFallback = true;
    }

    // Attempt D: Fallback Hub, ANY Month
    if (!validFlights || validFlights.length === 0) {
        console.warn(`⚠️ Hub empty for month. Searching ANY date for ${targetDestination}`);
        validFlights = await fetchCachedFlights(params.origin, targetDestination, null);
    }

    // Attempt E: "Anywhere" Search (The Nuclear Option)
    if (!validFlights || validFlights.length === 0) {
        console.warn(`⚠️ Nuclear Fallback: Searching flights to ANYWHERE from ${params.origin}`);
        validFlights = await fetchCachedFlights(params.origin, null, null);
        isFallback = true;
        fallbackType = 'anywhere';
    }

    // 4. Handle Complete Failure
    if (!validFlights || validFlights.length === 0) {
        return NextResponse.json({
            success: false,
            error: "No flights found. Try a major airport like LON or MAN."
        });
    }

    // 5. Format & Sort Results
    const deals: PackageDeal[] = validFlights
      .map((flight: any, index) => {
        // Handle "Anywhere" results having destination in the object
        const destCode = flight.destination || targetDestination;
        const cityName = CITY_NAMES[destCode] || destCode;

        const flightPriceTotal = flight.price * params.adults;
        const hotelPriceEst = 100 * params.nights; 
        const total = flightPriceTotal + hotelPriceEst;

        const actualDepart = flight.departure_at ? flight.departure_at.split('T')[0] : checkin_date;
        const actualReturn = flight.return_at ? flight.return_at.split('T')[0] : checkout_date;

        return {
          id: `pkg_${flight.flight_number || index}_${destCode}`,
          city: cityName,
          country: 'XX',
          iata: destCode,
          lat: 48.85, lng: 2.35, // Placeholder coords
          nights: params.nights,
          adults: params.adults,
          totalPrice: Math.round(total),
          currency: 'GBP',
          priceBreakdown: { flight: flightPriceTotal, hotel: hotelPriceEst },
          searchedAt: new Date().toISOString(),
          validUntil: flight.expires_at,
          
          hotel: {
            id: `h_${index}`,
            name: `Recommended Hotel in ${cityName}`,
            image: `https://source.unsplash.com/800x600/?hotel,${cityName}`,
            rating: 8.0,
            price: hotelPriceEst,
            bookingLink: `https://www.booking.com/searchresults.html?ss=${cityName}`,
            partnerName: 'Booking.com',
            partnerLink: `https://www.booking.com/searchresults.html?ss=${cityName}`,
            address: 'City Center',
            priceRange: { min: hotelPriceEst, max: hotelPriceEst, average: hotelPriceEst }
          },
          
          flight: {
            price: flightPriceTotal,
            currency: 'GBP',
            outboundDate: actualDepart,
            returnDate: actualReturn,
            outboundDeparture: flight.departure_at ? flight.departure_at.split('T')[1].slice(0,5) : '10:00',
            outboundArrival: '14:00',
            outboundStops: flight.transfers || 0,
            inboundStops: flight.transfers || 0,
            airlines: [flight.airline || 'Multiple'],
            validatingAirline: flight.airline,
            duration: { outbound: '3h', inbound: '3h' },
            // MONETIZATION: Real Deep Link
            deep_link: `https://www.aviasales.com/search?origin=${params.origin}&destination=${destCode}&depart_date=${actualDepart}&return_date=${actualReturn}&passengers=${params.adults}&marker=${MARKER}`
          }
        };
      })
      .sort((a, b) => a.totalPrice - b.totalPrice) // Cheapest first
      .filter(d => d.totalPrice <= params.maxBudget + 500) // Budget check + buffer
      .slice(0, 15); // Limit results

    // 6. Return Response
    let disclaimer = `Found ${deals.length} flights to ${CITY_NAMES[targetDestination] || targetDestination}`;
    if (fallbackType === 'anywhere') {
        disclaimer = `Specific route unavailable. Showing cheapest flights from ${params.origin} to anywhere!`;
    } else if (isFallback) {
        disclaimer = `Route unavailable. Showing top deals to ${CITY_NAMES[targetDestination] || targetDestination}.`;
    }

    return NextResponse.json({
      success: true,
      count: deals.length,
      data: deals,
      searchParams: params,
      exactMatch: !isFallback,
      disclaimer: disclaimer
    });

  } catch (error: any) {
    console.error('API CRASH:', error.message);
    return NextResponse.json({ error: "System error." }, { status: 500 });
  }
}