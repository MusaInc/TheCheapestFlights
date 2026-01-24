const DEFAULT_KLOOK_HOTEL_LINKS: Record<string, string> = {
  Paris: 'https://www.klook.com/en-GB/destination/c107-paris/3-hotel/',
  London: 'https://www.klook.com/en-GB/destination/c106-london/3-hotel/',
  Barcelona: 'https://www.klook.com/destination/c108-barcelona/3-hotel/'
};

const normalizeCityKey = (city: string) => city.trim().toLowerCase();

const parseLinks = (raw?: string | null) => {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return Object.entries(parsed).reduce<Record<string, string>>((acc, [key, value]) => {
      if (!value || typeof value !== 'string') return acc;
      acc[normalizeCityKey(key)] = value;
      return acc;
    }, {});
  } catch (error) {
    return {};
  }
};

const envLinks = parseLinks(process.env.KLOOK_HOTEL_LINKS || process.env.NEXT_PUBLIC_KLOOK_HOTEL_LINKS);
const defaultLinks = Object.entries(DEFAULT_KLOOK_HOTEL_LINKS).reduce<Record<string, string>>(
  (acc, [key, value]) => {
    acc[normalizeCityKey(key)] = value;
    return acc;
  },
  {}
);

export const getKlookHotelLink = (city: string) => {
  if (!city) return null;
  const key = normalizeCityKey(city);
  return envLinks[key] || defaultLinks[key] || null;
};
