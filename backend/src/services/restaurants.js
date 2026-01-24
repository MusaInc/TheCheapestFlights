/**
 * Restaurants Service
 *
 * Integrates with TripAdvisor via RapidAPI to fetch top restaurants.
 * Falls back to a TripAdvisor search link when API access is unavailable.
 */

const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 1800, checkperiod: 300 });
const locationCache = new NodeCache({ stdTTL: 86400, checkperiod: 3600 });

const DEFAULT_HOST = 'tripadvisor16.p.rapidapi.com';
const DEFAULT_LIMIT = 6;

const LOCATION_ENDPOINTS = [
  '/api/v1/location/search',
  '/api/v1/location/searchLocation'
];

const normalizeCityKey = (city) => String(city || '').trim().toLowerCase();

const parseEnvLocationMap = () => {
  const raw = process.env.TRIPADVISOR_LOCATION_MAP;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return Object.entries(parsed).reduce((acc, [key, value]) => {
      if (!value) return acc;
      acc[normalizeCityKey(key)] = String(value);
      return acc;
    }, {});
  } catch (error) {
    console.warn('Invalid TRIPADVISOR_LOCATION_MAP JSON');
    return {};
  }
};

const ENV_LOCATION_MAP = parseEnvLocationMap();

const getRapidConfig = () => {
  const key = process.env.TRIPADVISOR_RAPIDAPI_KEY || process.env.RAPIDAPI_KEY;
  const host = process.env.TRIPADVISOR_RAPIDAPI_HOST || DEFAULT_HOST;
  if (!key) return null;
  return { key, host };
};

const buildHeaders = (config) => ({
  'x-rapidapi-key': config.key,
  'x-rapidapi-host': config.host
});

const generateTripadvisorSearchLink = (city) => {
  const query = encodeURIComponent(`${city} restaurants`);
  return `https://www.tripadvisor.com/Search?q=${query}`;
};

const parseNumber = (value) => {
  const parsed = Number.parseFloat(`${value}`);
  return Number.isFinite(parsed) ? parsed : null;
};

const extractLocationId = (payload) => {
  let found = null;
  const visit = (value, key = '') => {
    if (found) return;
    if (value === null || value === undefined) return;
    if (Array.isArray(value)) {
      value.forEach((item) => visit(item, key));
      return;
    }
    if (typeof value === 'object') {
      Object.entries(value).forEach(([nextKey, nextValue]) => {
        visit(nextValue, nextKey);
      });
      return;
    }
    const keyName = String(key).toLowerCase();
    if (!/locationid|location_id|geoid|geo_id/.test(keyName)) return;
    const candidate = String(value).trim();
    if (/^\d+$/.test(candidate)) {
      found = candidate;
    }
  };

  visit(payload);
  return found;
};

const findRestaurantList = (payload) => {
  const directCandidates = [
    payload?.data?.data,
    payload?.data?.restaurants,
    payload?.data?.results,
    payload?.data,
    payload?.restaurants,
    payload?.results
  ];
  const directList = directCandidates.find((value) => Array.isArray(value));
  if (directList) return directList;

  let found = null;
  const isRestaurantCandidate = (item) =>
    item &&
    typeof item === 'object' &&
    (item.name || item.title) &&
    (item.rating || item.review_count || item.num_reviews || item.photo);

  const visit = (value) => {
    if (found) return;
    if (!value) return;
    if (Array.isArray(value)) {
      if (value.length > 0 && value.some(isRestaurantCandidate)) {
        found = value;
        return;
      }
      value.forEach((item) => visit(item));
      return;
    }
    if (typeof value === 'object') {
      Object.values(value).forEach((item) => visit(item));
    }
  };

  visit(payload);
  return found || [];
};

const normalizeRestaurant = (item, index, fallbackLink) => {
  const id =
    item?.locationId ||
    item?.location_id ||
    item?.id ||
    item?.restaurantId ||
    `restaurant-${index}`;

  const rating =
    parseNumber(item?.rating) ||
    parseNumber(item?.rating?.value) ||
    parseNumber(item?.rating?.primary) ||
    null;

  const reviewCount =
    Number.parseInt(item?.num_reviews || item?.review_count || item?.reviewCount || item?.numReviews, 10) ||
    null;

  const priceLevel =
    item?.price ||
    item?.priceLevel ||
    item?.price_level ||
    item?.priceRange ||
    null;

  const cuisine = Array.isArray(item?.cuisine)
    ? item.cuisine.map((c) => c?.name).filter(Boolean)
    : [];

  const image =
    item?.photo?.images?.large?.url ||
    item?.photo?.images?.medium?.url ||
    item?.photo?.images?.small?.url ||
    item?.photo?.images?.original?.url ||
    '';

  const bookingLink =
    item?.webUrl ||
    item?.web_url ||
    item?.website ||
    item?.detailUrl ||
    item?.url ||
    fallbackLink;

  return {
    id: String(id),
    name: item?.name || item?.title || 'Top restaurant',
    rating,
    reviewCount,
    priceLevel: typeof priceLevel === 'string' ? priceLevel : null,
    cuisine,
    image,
    bookingLink
  };
};

async function resolveLocationId(city, config) {
  const normalized = normalizeCityKey(city);
  if (!normalized) return null;

  const cached = locationCache.get(normalized);
  if (cached) return cached;

  if (ENV_LOCATION_MAP[normalized]) {
    locationCache.set(normalized, ENV_LOCATION_MAP[normalized]);
    return ENV_LOCATION_MAP[normalized];
  }

  for (const endpoint of LOCATION_ENDPOINTS) {
    try {
      const url = new URL(`https://${config.host}${endpoint}`);
      url.searchParams.set('query', city);
      const response = await fetch(url.toString(), {
        headers: buildHeaders(config)
      });
      if (!response.ok) {
        continue;
      }
      const payload = await response.json();
      const locationId = extractLocationId(payload);
      if (locationId) {
        locationCache.set(normalized, locationId);
        return locationId;
      }
    } catch (error) {
      continue;
    }
  }

  return null;
}

async function searchRestaurants(city, options = {}) {
  const config = getRapidConfig();
  const limit = Number.isFinite(options.limit) ? options.limit : DEFAULT_LIMIT;

  if (!config || !city) {
    return {
      city,
      restaurants: [],
      source: 'unavailable',
      searchLink: generateTripadvisorSearchLink(city || ''),
      disclaimer: 'TripAdvisor data unavailable.'
    };
  }

  const cacheKey = `restaurants:${normalizeCityKey(city)}:${limit}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const locationId = await resolveLocationId(city, config);
  const searchLink = generateTripadvisorSearchLink(city);
  if (!locationId) {
    return {
      city,
      restaurants: [],
      source: 'unavailable',
      searchLink,
      disclaimer: 'TripAdvisor location lookup failed.'
    };
  }

  try {
    const url = new URL(`https://${config.host}/api/v1/restaurant/searchRestaurants`);
    url.searchParams.set('locationId', locationId);
    url.searchParams.set('limit', String(limit));

    const response = await fetch(url.toString(), {
      headers: buildHeaders(config)
    });

    if (!response.ok) {
      return {
        city,
        restaurants: [],
        source: 'unavailable',
        searchLink,
        disclaimer: 'TripAdvisor restaurants lookup failed.'
      };
    }

    const payload = await response.json();
    const list = findRestaurantList(payload);
    const restaurants = list.slice(0, limit).map((item, index) =>
      normalizeRestaurant(item, index, searchLink)
    );

    const result = {
      city,
      restaurants,
      source: 'rapidapi',
      searchLink,
      disclaimer: 'Restaurant details provided by TripAdvisor.'
    };

    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    return {
      city,
      restaurants: [],
      source: 'unavailable',
      searchLink,
      disclaimer: 'TripAdvisor restaurants lookup failed.'
    };
  }
}

module.exports = {
  searchRestaurants
};
