export type FlightDetails = {
  price: number;
  currency: string;
  outboundDate: string;
  returnDate: string | null;
  outboundDeparture: string;
  outboundArrival: string;
  outboundStops: number;
  inboundStops: number;
  airlines: string[];
  validatingAirline: string;
  duration: {
    outbound: string;
    inbound: string | null;
  };
};

export type HotelDetails = {
  id: string;
  name: string;
  image: string;
  rating: number;
  price: number;
  bookingLink: string;
  address?: string;
  // Kept optional for backward compatibility if you still have "estimated" logic elsewhere
  priceRange?: {
    min: number;
    max: number;
    average: number;
  };
};

export type PackageDeal = {
  id: string;
  city: string;
  country: string;
  iata: string;
  lat: number;
  lng: number;
  nights: number;
  adults: number;
  
  // The complex objects
  flight: FlightDetails;
  hotel: HotelDetails;
  
  // Pricing
  totalPrice: number;
  currency: string;
  priceBreakdown: {
    flight: number;
    hotel: number; // Renamed from hotelEstimate since it's real price now
  };
  
  // Metadata
  searchedAt: string;
  validUntil: string | null;
};

export type PackageSearchParams = {
  origin: string;
  maxBudget: number;
  nights: number;
  adults: number;
  // Merged moods: Includes your original 'sun'/'city' and the new specific ones
  mood: 'sun' | 'city' | 'romantic' | 'adventure' | 'chill' | 'random';
};

export type PackageSearchResponse = {
  success: boolean;
  count: number;
  data: PackageDeal[];
  searchParams: PackageSearchParams;
  disclaimer: string;
  // Optional error message field useful for UI handling
  error?: string; 
};