/**
 * Klook hotel deep links by city.
 *
 * These should be affiliate deep links generated from the Klook Link Generator.
 * Configure via KLOOK_HOTEL_LINKS (JSON map of city -> url).
 * Example:
 * {
 *   "Paris": "https://www.klook.com/en-GB/destination/c107-paris/3-hotel/",
 *   "London": "https://www.klook.com/en-GB/destination/c106-london/3-hotel/",
 *   "Barcelona": "https://www.klook.com/destination/c108-barcelona/3-hotel/"
 * }
 */

const DEFAULT_KLOOK_HOTEL_LINKS = {
  Paris: 'https://www.klook.com/en-GB/destination/c107-paris/3-hotel/',
  London: 'https://www.klook.com/en-GB/destination/c106-london/3-hotel/',
  Barcelona: 'https://www.klook.com/destination/c108-barcelona/3-hotel/'
};

const normalizeCityKey = (city) => String(city || '').trim().toLowerCase();

const parseLinks = (raw) => {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return Object.entries(parsed).reduce((acc, [key, value]) => {
      if (!value || typeof value !== 'string') return acc;
      acc[normalizeCityKey(key)] = value;
      return acc;
    }, {});
  } catch (error) {
    console.warn('Invalid KLOOK_HOTEL_LINKS JSON');
    return {};
  }
};

const envLinks = parseLinks(process.env.KLOOK_HOTEL_LINKS);
const defaultLinks = Object.entries(DEFAULT_KLOOK_HOTEL_LINKS).reduce((acc, [key, value]) => {
  acc[normalizeCityKey(key)] = value;
  return acc;
}, {});

const getKlookHotelLink = (city) => {
  const key = normalizeCityKey(city);
  if (!key) return null;
  return envLinks[key] || defaultLinks[key] || null;
};

module.exports = {
  getKlookHotelLink
};
