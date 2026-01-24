export type TransportType = 'flight' | 'train';

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

export type TransportDetails = {
  type: TransportType;
  price: number;
  currency: string;
  outboundDate: string;
  returnDate: string | null;
  outboundDeparture: string;
  outboundArrival: string;
  outboundStops: number;
  inboundStops: number;
  carriers: string[];
  validatingCarrier: string;
  duration: {
    outbound: string;
    inbound: string | null;
  };
  bookingLink: string | null;
  isDirect: boolean;
  trainTypes: string[] | null;
};

export type HotelDetails = {
  id: string;
  name: string;
  image: string;
  rating: number;
  price: number;
  bookingLink: string;
  partnerLink?: string | null;
  partnerName?: string;
  address?: string;
  priceRange?: {
    min: number;
    max: number;
    average: number;
  };
};

export type HotelOption = {
  id: string;
  name: string;
  image: string;
  rating: number;
  price: number;
  bookingLink: string;
};

export type AddonCategory = {
  id: string;
  name: string;
  icon: string;
  description: string;
  link: string;
  available: boolean;
  popular?: boolean;
};

export type AddonHighlight = {
  name: string;
  type: string;
  priceFrom: number;
  bookingLink: string;
};

export type RestaurantOption = {
  id: string;
  name: string;
  rating?: number | null;
  reviewCount?: number | null;
  priceLevel?: string | null;
  cuisine?: string[];
  image?: string;
  bookingLink?: string;
};

export type ManualPackage = {
  id: string;
  title: string;
  description?: string;
  url: string;
  priceFrom?: number | null;
  currency?: string;
  priceSuffix?: string | null;
  highlights?: string[];
  origin?: string;
  startDate?: string | null;
};

export type InsuranceOption = {
  tier: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  bookingLink: string;
  recommended?: boolean;
};

export type TransferOption = {
  type: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  bookingLink: string;
};

export type PackageAddons = {
  available: boolean;
  mainLink?: string;
  categories?: AddonCategory[];
  highlights?: AddonHighlight[];
  restaurants?: RestaurantOption[];
  restaurantLink?: string;
  restaurantDisclaimer?: string;
  insurance?: InsuranceOption | null;
  transfers?: TransferOption | null;
  suggestedTotal?: number;
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

  // Transport type indicator
  transportType: TransportType;

  // New unified transport object
  transport?: TransportDetails;

  // Legacy flight field for backward compatibility
  flight: FlightDetails;

  // Hotel
  hotel: HotelDetails;

  // Alternative hotel options
  hotelOptions?: HotelOption[];

  // Add-ons (tours, activities, insurance, etc.)
  addons?: PackageAddons;

  // Pricing
  totalPrice: number;
  currency: string;
  priceBreakdown: {
    transport?: number;
    flight: number;
    train?: number;
    hotel: number;
    hotelEstimate?: number;
    addonsEstimate?: number;
  };

  // Grand total with add-ons
  totalWithAddons?: number;

  // Metadata
  searchedAt: string;
  validUntil: string | null;
};

export type PackageSearchParams = {
  origin: string;
  maxBudget: number;
  nights: number;
  adults: number;
  mood: 'sun' | 'city' | 'romantic' | 'adventure' | 'chill' | 'random' | 'train';
  transportType?: 'flight' | 'train' | 'any';
};

export type PackageSearchResponse = {
  success: boolean;
  count: number;
  data: PackageDeal[];
  searchParams: PackageSearchParams;
  disclaimer: string;
  exactMatch?: boolean;
  manualPackages?: ManualPackage[];
  error?: string;
};
