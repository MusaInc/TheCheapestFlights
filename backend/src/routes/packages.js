/**
 * Package Routes
 *
 * Main endpoint for holiday package discovery.
 * Combines flight + hotel data into complete holiday packages.
 */

const express = require('express');
const router = express.Router();
const packageService = require('../services/packages');
const { DEFAULT_ORIGIN } = require('../config/destinations');

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
 * - mood: 'sun', 'city', or 'random' (default: random)
 */
router.get('/search', async (req, res) => {
  try {
    const {
      origin = DEFAULT_ORIGIN,
      maxBudget = 500,
      nights = 4,
      adults = 2,
      mood = 'random',
      departureDate,
      returnDate,
      debug,
      relaxBudget,
      relaxMood
    } = req.query;

    const normalizedOrigin = origin ? origin.toUpperCase() : DEFAULT_ORIGIN;
    const parsedNights = parseInt(nights);
    const parsedAdults = parseInt(adults);
    const parsedBudget = parseInt(maxBudget);
    const toBoolean = (value) => ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
    const debugEnabled = toBoolean(debug);
    const relaxBudgetEnabled = debugEnabled || toBoolean(relaxBudget);
    const relaxMoodEnabled = debugEnabled || toBoolean(relaxMood);
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const hasDeparture = Boolean(departureDate);
    const hasReturn = Boolean(returnDate);

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

    const fixedDates = hasDeparture
      ? [{ outbound: departureDate, return: returnDate, nights: parsedNights }]
      : null;

    console.log(
      `Package search: origin=${normalizedOrigin}, budget=${parsedBudget}, nights=${parsedNights}, mood=${mood}, debug=${debugEnabled}`
    );

    const packages = await packageService.searchPackages({
      origin: normalizedOrigin,
      maxBudget: parsedBudget,
      nights: parsedNights,
      adults: parsedAdults,
      mood,
      debug: debugEnabled,
      relaxBudget: relaxBudgetEnabled,
      relaxMood: relaxMoodEnabled,
      fixedDates
    });

    res.json({
      success: true,
      count: packages.length,
      data: packages,
      searchParams: {
        origin: normalizedOrigin,
        maxBudget: parsedBudget,
        nights: parsedNights,
        adults: parsedAdults,
        mood,
        departureDate: hasDeparture ? departureDate : undefined,
        returnDate: hasReturn ? returnDate : undefined
      },
      disclaimer: 'Flight prices are provided by Amadeus. Hotel prices shown on Booking.com. All prices subject to availability at time of booking.'
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
 * GET /api/packages/:iata
 *
 * Get package for a specific destination
 */
router.get('/:iata', async (req, res) => {
  try {
    const { iata } = req.params;
    const { nights = 4, adults = 2 } = req.query;

    const pkg = await packageService.getPackageByDestination(iata.toUpperCase(), {
      nights: parseInt(nights),
      adults: parseInt(adults)
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
      disclaimer: 'Flight prices are provided by Amadeus. Hotel prices shown on Booking.com. All prices subject to availability at time of booking.'
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
