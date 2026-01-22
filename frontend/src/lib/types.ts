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
  searchUrl: string;
  estimatedPrice: number;
  priceRange: {
    min: number;
    max: number;
    average: number;
  };
  disclaimer: string;
};

export type PackageDeal = {
  id: string;
  city: string;
  country: string;
  iata: string;
  lat: number;
  lng: number;
  nights: number;
  flight: FlightDetails;
  hotel: HotelDetails;
  totalPrice: number;
  currency: string;
  priceBreakdown: {
    flight: number;
    hotelEstimate: number;
  };
  searchedAt: string;
  validUntil: string | null;
  adults: number;
};

export type PackageSearchParams = {
  origin: string;
  maxBudget: number;
  nights: number;
  adults: number;
  mood: 'sun' | 'city' | 'random';
};

export type PackageSearchResponse = {
  success: boolean;
  count: number;
  data: PackageDeal[];
  searchParams: PackageSearchParams;
  disclaimer: string;
};
