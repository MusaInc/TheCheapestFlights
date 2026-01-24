/**
 * Curated Destination List
 *
 * These are the destinations we search for cheap flights to.
 * All are reachable from London with budget airlines.
 * Coordinates are used for map display.
 */

const DESTINATIONS = [
  // Spain
  { city: 'Barcelona', country: 'Spain', iata: 'BCN', lat: 41.3851, lng: 2.1734 },
  { city: 'Madrid', country: 'Spain', iata: 'MAD', lat: 40.4168, lng: -3.7038 },
  { city: 'Malaga', country: 'Spain', iata: 'AGP', lat: 36.7213, lng: -4.4214 },
  { city: 'Alicante', country: 'Spain', iata: 'ALC', lat: 38.2822, lng: -0.5582 },
  { city: 'Palma', country: 'Spain', iata: 'PMI', lat: 39.5517, lng: 2.7388 },
  { city: 'Tenerife', country: 'Spain', iata: 'TFS', lat: 28.0445, lng: -16.5725 },

  // Portugal
  { city: 'Lisbon', country: 'Portugal', iata: 'LIS', lat: 38.7746, lng: -9.1349 },
  { city: 'Porto', country: 'Portugal', iata: 'OPO', lat: 41.2370, lng: -8.6700 },
  { city: 'Faro', country: 'Portugal', iata: 'FAO', lat: 37.0146, lng: -7.9656 },

  // Italy
  { city: 'Rome', country: 'Italy', iata: 'FCO', lat: 41.9028, lng: 12.4964 },
  { city: 'Milan', country: 'Italy', iata: 'MXP', lat: 45.4642, lng: 9.1900 },
  { city: 'Venice', country: 'Italy', iata: 'VCE', lat: 45.4408, lng: 12.3155 },
  { city: 'Naples', country: 'Italy', iata: 'NAP', lat: 40.8518, lng: 14.2681 },

  // France
  { city: 'Paris', country: 'France', iata: 'CDG', lat: 48.8566, lng: 2.3522 },
  { city: 'Nice', country: 'France', iata: 'NCE', lat: 43.7102, lng: 7.2620 },
  { city: 'Lyon', country: 'France', iata: 'LYS', lat: 45.7640, lng: 4.8357 },

  // Germany
  { city: 'Berlin', country: 'Germany', iata: 'BER', lat: 52.5200, lng: 13.4050 },
  { city: 'Munich', country: 'Germany', iata: 'MUC', lat: 48.1351, lng: 11.5820 },

  // Netherlands
  { city: 'Amsterdam', country: 'Netherlands', iata: 'AMS', lat: 52.3676, lng: 4.9041 },

  // Belgium
  { city: 'Brussels', country: 'Belgium', iata: 'BRU', lat: 50.8503, lng: 4.3517 },

  // Eastern Europe
  { city: 'Prague', country: 'Czech Republic', iata: 'PRG', lat: 50.0755, lng: 14.4378 },
  { city: 'Budapest', country: 'Hungary', iata: 'BUD', lat: 47.4979, lng: 19.0402 },
  { city: 'Krakow', country: 'Poland', iata: 'KRK', lat: 50.0647, lng: 19.9450 },
  { city: 'Warsaw', country: 'Poland', iata: 'WAW', lat: 52.2297, lng: 21.0122 },
  { city: 'Vienna', country: 'Austria', iata: 'VIE', lat: 48.2082, lng: 16.3738 },

  // Nordic
  { city: 'Copenhagen', country: 'Denmark', iata: 'CPH', lat: 55.6761, lng: 12.5683 },
  { city: 'Stockholm', country: 'Sweden', iata: 'ARN', lat: 59.3293, lng: 18.0686 },

  // Balkans & Mediterranean
  { city: 'Dubrovnik', country: 'Croatia', iata: 'DBV', lat: 42.6507, lng: 18.0944 },
  { city: 'Split', country: 'Croatia', iata: 'SPU', lat: 43.5081, lng: 16.4402 },
  { city: 'Athens', country: 'Greece', iata: 'ATH', lat: 37.9838, lng: 23.7275 },
  { city: 'Thessaloniki', country: 'Greece', iata: 'SKG', lat: 40.6401, lng: 22.9444 },

  // Baltic
  { city: 'Riga', country: 'Latvia', iata: 'RIX', lat: 56.9496, lng: 24.1052 },
  { city: 'Tallinn', country: 'Estonia', iata: 'TLL', lat: 59.4370, lng: 24.7536 },
  { city: 'Vilnius', country: 'Lithuania', iata: 'VNO', lat: 54.6872, lng: 25.2797 }
];

// London airports as origin
const LONDON_AIRPORTS = ['LHR', 'LGW', 'STN', 'LTN', 'SEN'];
const DEFAULT_ORIGIN = 'LON'; // City code covering London airports

module.exports = {
  DESTINATIONS,
  LONDON_AIRPORTS,
  DEFAULT_ORIGIN
};
