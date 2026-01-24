/**
 * Package Routes
 *
 * Main endpoint for holiday package discovery.
 * Combines transport (flight or train) + hotel data into complete holiday packages.
 * Now includes add-ons (tours, activities, insurance, etc.) via Klook.
 */

const express = require('express');
const router = express.Router();
const packageService = require('../services/packages');
const manualPackagesService = require('../services/manualPackages');
const { DEFAULT_ORIGIN } = require('../config/destinations');

const VALID_MOODS = new Set(['sun', 'city', 'random', 'romantic', 'adventure', 'chill', 'train']);
const VALID_TRANSPORT_TYPES = new Set(['flight', 'train', 'any']);

const toBoolean = (value) => ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());

const toPositiveInt = (value, fallback, { min = 0, max } = {}) => {
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  const clamped = Math.max(min, parsed);
  return typeof max === 'number' ? Math.min(clamped, max) : clamped;
};

/**
 * GET /api/packages/search
 *
 * Search for holiday packages
 * This is the MAIN endpoint the frontend calls
 *
 * Query params:
 * - origin: Origin IATA code (default: LON)
 * - maxBudget: Maximum total price in GBP (default: 500)
 * - nights: Stay length (default: 4)
 * - adults: Number of adults (default: 2)
 * - mood: 'sun', 'city', 'random', 'romantic', 'adventure', 'chill', 'train' (default: random)
 * - transportType: 'flight', 'train', or 'any' (default: any)
 * - includeAddons: Include add-ons data (default: true)
 */
router.get('/search', async (req, res) => {
  try {
    const {
      origin = DEFAULT_ORIGIN,
      maxBudget = 500,
      nights = 4,
      adults = 2,
      mood = 'random',
      transportType = 'any',
      includeAddons = 'true',
      departureDate,
      returnDate,
      debug,
      relaxBudget,
      relaxMood
    } = req.query;

    const normalizedOrigin = origin ? origin.toUpperCase() : DEFAULT_ORIGIN;
    const parsedNights = toPositiveInt(nights, 4, { min: 1, max: 28 });
    const parsedAdults = toPositiveInt(adults, 2, { min: 1, max: 9 });
    const parsedBudget = toPositiveInt(maxBudget, 500, { min: 0 });
    const debugEnabled = toBoolean(debug);
    const relaxBudgetEnabled = debugEnabled || toBoolean(relaxBudget);
    const relaxMoodEnabled = debugEnabled || toBoolean(relaxMood);
    const includeAddonsEnabled = toBoolean(includeAddons);

    const moodValue = String(mood).toLowerCase();
    const parsedMood = VALID_MOODS.has(moodValue) ? moodValue : 'random';

    const transportTypeValue = String(transportType).toLowerCase();
    const parsedTransportType = VALID_TRANSPORT_TYPES.has(transportTypeValue) ? transportTypeValue : 'any';
    const manualCutoffDays = toPositiveInt(process.env.MANUAL_PACKAGE_CUTOFF_DAYS, 14, { min: 1, max: 90 });

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const hasDeparture = Boolean(departureDate);
    const hasReturn = Boolean(returnDate);
    let effectiveNights = parsedNights;

    if (hasDeparture !== hasReturn) {
      return res.status(400).json({
        error: 'Both departureDate and returnDate are required together.'
      });
    }

    if (hasDeparture && (!dateRegex.test(departureDate) || !dateRegex.test(returnDate))) {
      return res.status(400).json({
        error: 'Invalid date format. Use YYYY-MM-DD.'
      });
    }

    if (hasDeparture) {
      const departure = new Date(departureDate);
      const inbound = new Date(returnDate);
      if (!(departure instanceof Date) || Number.isNaN(departure.getTime())) {
        return res.status(400).json({ error: 'Invalid departureDate' });
      }
      if (!(inbound instanceof Date) || Number.isNaN(inbound.getTime())) {
        return res.status(400).json({ error: 'Invalid returnDate' });
      }
      if (inbound <= departure) {
        return res.status(400).json({ error: 'returnDate must be after departureDate' });
      }
      const diffMs = inbound.getTime() - departure.getTime();
      effectiveNights = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    }

    const fixedDates = hasDeparture
      ? [{ outbound: departureDate, return: returnDate, nights: effectiveNights }]
      : null;

    console.log(
      `Package search: origin=${normalizedOrigin}, budget=${parsedBudget}, nights=${effectiveNights}, mood=${parsedMood}, transport=${parsedTransportType}, debug=${debugEnabled}`
    );

    const { packages, exactMatch, stats } = await packageService.searchPackages({
      origin: normalizedOrigin,
      maxBudget: parsedBudget,
      nights: effectiveNights,
      adults: parsedAdults,
      mood: parsedMood,
      transportType: parsedTransportType,
      includeAddons: includeAddonsEnabled,
      debug: debugEnabled,
      relaxBudget: relaxBudgetEnabled,
      relaxMood: relaxMoodEnabled,
      fixedDates
    });
    const manualPackages = manualPackagesService.getManualPackages({
      origin: normalizedOrigin,
      cutoffDays: manualCutoffDays
    });

    res.json({
      success: true,
      count: packages.length,
      data: packages,
      exactMatch,
      manualPackages,
      searchParams: {
        origin: normalizedOrigin,
        maxBudget: parsedBudget,
        nights: effectiveNights,
        adults: parsedAdults,
        mood: parsedMood,
        transportType: parsedTransportType,
        departureDate: hasDeparture ? departureDate : undefined,
        returnDate: hasReturn ? returnDate : undefined
      },
      stats: debugEnabled ? stats : undefined,
      disclaimer: 'Flight prices use live sources where available (Booking.com/Skyscanner) or estimates. Train prices are estimates. Hotel prices on Booking.com. Add-ons via Klook. All prices subject to availability.'
    });

  } catch (error) {
    console.error('Package search error:', error);
    res.status(500).json({
      error: 'Failed to search packages',
      message: error.message
    });
  }
});

/**
 * GET /api/packages/compare/:destination
 *
 * Compare flight vs train for a specific destination
 */
router.get('/compare/:destination', async (req, res) => {
  try {
    const { destination } = req.params;
    const { nights = 4, adults = 2 } = req.query;

    const parsedNights = toPositiveInt(nights, 4, { min: 1, max: 28 });
    const parsedAdults = toPositiveInt(adults, 2, { min: 1, max: 9 });

    const comparison = await packageService.compareTransportOptions(destination, {
      nights: parsedNights,
      adults: parsedAdults
    });

    res.json({
      success: true,
      data: comparison
    });

  } catch (error) {
    console.error('Compare error:', error);
    res.status(500).json({
      error: 'Failed to compare transport options',
      message: error.message
    });
  }
});

/**
 * GET /api/packages/trains
 *
 * Get train-only packages (eco-friendly option)
 */
router.get('/trains', async (req, res) => {
  try {
    const {
      maxBudget = 800,
      nights = 4,
      adults = 2,
      mood = 'random',
      debug
    } = req.query;

    const parsedNights = toPositiveInt(nights, 4, { min: 1, max: 28 });
    const parsedAdults = toPositiveInt(adults, 2, { min: 1, max: 9 });
    const parsedBudget = toPositiveInt(maxBudget, 800, { min: 0 });
    const debugEnabled = toBoolean(debug);
    const moodValue = String(mood).toLowerCase();
    const parsedMood = VALID_MOODS.has(moodValue) ? moodValue : 'random';

    const { packages, exactMatch, stats } = await packageService.searchTrainPackages({
      maxBudget: parsedBudget,
      nights: parsedNights,
      adults: parsedAdults,
      mood: parsedMood,
      debug: debugEnabled
    });

    res.json({
      success: true,
      count: packages.length,
      data: packages,
      exactMatch,
      searchParams: {
        origin: 'LON',
        maxBudget: parsedBudget,
        nights: parsedNights,
        adults: parsedAdults,
        mood: parsedMood,
        transportType: 'train'
      },
      stats: debugEnabled ? stats : undefined,
      disclaimer: 'Train prices are estimates based on typical fares. Actual prices shown on booking site. Eco-friendly travel option.'
    });

  } catch (error) {
    console.error('Train packages error:', error);
    res.status(500).json({
      error: 'Failed to search train packages',
      message: error.message
    });
  }
});

/**
 * GET /api/packages/:iata
 *
 * Get package for a specific destination
 */
router.get('/:iata', async (req, res) => {
  try {
    const { iata } = req.params;
    const { nights = 4, adults = 2, transportType = 'any' } = req.query;
    const parsedNights = toPositiveInt(nights, 4, { min: 1, max: 28 });
    const parsedAdults = toPositiveInt(adults, 2, { min: 1, max: 9 });
    const transportTypeValue = String(transportType).toLowerCase();
    const parsedTransportType = VALID_TRANSPORT_TYPES.has(transportTypeValue) ? transportTypeValue : 'any';

    const pkg = await packageService.getPackageByDestination(iata.toUpperCase(), {
      nights: parsedNights,
      adults: parsedAdults,
      transportType: parsedTransportType
    });

    if (!pkg) {
      return res.status(404).json({
        error: 'No package found for this destination',
        destination: iata
      });
    }

    res.json({
      success: true,
      data: pkg,
      disclaimer: 'Prices subject to availability at time of booking.'
    });

  } catch (error) {
    console.error('Package fetch error:', error);
    res.status(500).json({
      error: 'Failed to get package',
      message: error.message
    });
  }
});

module.exports = router;
