const manualPackages = require('../data/manualPackages');
const { DEFAULT_ORIGIN } = require('../config/destinations');

const ORIGIN_ALIASES = {
  LONDON: 'LON',
  LHR: 'LON',
  LGW: 'LON',
  STN: 'LON',
  LTN: 'LON',
  LCY: 'LON',
  MANCHESTER: 'MAN',
  BIRMINGHAM: 'BHX',
  EDINBURGH: 'EDI',
  DUBLIN: 'DUB'
};

const normalizeOrigin = (origin) => {
  if (!origin) return DEFAULT_ORIGIN;
  const normalized = String(origin).trim().toUpperCase();
  return ORIGIN_ALIASES[normalized] || normalized;
};

const matchesOrigin = (entry, origin) => {
  if (!entry.origin || entry.origin === 'ANY') return true;
  const normalized = normalizeOrigin(origin);
  const entryOrigin = Array.isArray(entry.origin) ? entry.origin : [entry.origin];
  return entryOrigin.map((value) => normalizeOrigin(value)).includes(normalized);
};

const isValidStartDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value));

const isWithinCutoff = (startDate, cutoffDays) => {
  if (!startDate || !isValidStartDate(startDate)) return false;
  const start = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(start.getTime())) return false;
  const cutoff = new Date(start);
  cutoff.setDate(cutoff.getDate() - cutoffDays);
  return new Date() >= cutoff;
};

const toNumber = (value) => {
  const parsed = Number.parseFloat(`${value}`);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizePackage = (entry) => ({
  id: entry.id,
  title: entry.title,
  description: entry.description,
  priceFrom: toNumber(entry.priceFrom),
  currency: entry.currency || 'GBP',
  priceSuffix: entry.priceSuffix || null,
  url: entry.url,
  highlights: Array.isArray(entry.highlights) ? entry.highlights : [],
  origin: entry.origin || 'ANY',
  startDate: entry.startDate || null
});

const getManualPackages = ({ origin, cutoffDays = 14 } = {}) => {
  const filtered = manualPackages
    .filter((entry) => entry && entry.url && entry.title)
    .filter((entry) => matchesOrigin(entry, origin))
    .filter((entry) => !isWithinCutoff(entry.startDate, cutoffDays))
    .map((entry) => normalizePackage(entry));

  return filtered.sort((a, b) => {
    if (typeof a.priceFrom !== 'number' && typeof b.priceFrom !== 'number') return 0;
    if (typeof a.priceFrom !== 'number') return 1;
    if (typeof b.priceFrom !== 'number') return -1;
    return a.priceFrom - b.priceFrom;
  });
};

module.exports = {
  getManualPackages
};
