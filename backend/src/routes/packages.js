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
      mood = 'random'
    } = req.query;

    const normalizedOrigin = origin ? origin.toUpperCase() : DEFAULT_ORIGIN;

    console.log(`Package search: origin=${normalizedOrigin}, budget=${maxBudget}, nights=${nights}, mood=${mood}`);

    const packages = await packageService.searchPackages({
      origin: normalizedOrigin,
      maxBudget: parseInt(maxBudget),
      nights: parseInt(nights),
      adults: parseInt(adults),
      mood
    });

    res.json({
      success: true,
      count: packages.length,
      data: packages,
      searchParams: {
        origin: normalizedOrigin,
        maxBudget: parseInt(maxBudget),
        nights: parseInt(nights),
        adults: parseInt(adults),
        mood
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
