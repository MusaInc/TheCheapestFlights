/**
 * Train Routes
 *
 * API endpoints for train travel search and booking links.
 * Supports Eurostar and connecting European rail services.
 */

const express = require('express');
const router = express.Router();
const trainService = require('../services/trains');

const toPositiveInt = (value, fallback, { min = 0, max } = {}) => {
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  const clamped = Math.max(min, parsed);
  return typeof max === 'number' ? Math.min(clamped, max) : clamped;
};

/**
 * GET /api/trains/search
 *
 * Search for train options between cities
 *
 * Query params:
 * - origin: Origin city or IATA code (default: London)
 * - destination: Destination city or IATA code (required)
 * - departureDate: YYYY-MM-DD (required)
 * - returnDate: YYYY-MM-DD (required for return trips)
 * - adults: Number of adults (default: 2)
 */
router.get('/search', async (req, res) => {
  try {
    const {
      origin = 'London',
      destination,
      departureDate,
      returnDate,
      adults = 2
    } = req.query;

    // Validate required params
    if (!destination) {
      return res.status(400).json({ error: 'destination is required' });
    }

    if (!departureDate) {
      return res.status(400).json({ error: 'departureDate is required (YYYY-MM-DD)' });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(departureDate)) {
      return res.status(400).json({ error: 'Invalid departureDate format. Use YYYY-MM-DD' });
    }

    if (returnDate && !dateRegex.test(returnDate)) {
      return res.status(400).json({ error: 'Invalid returnDate format. Use YYYY-MM-DD' });
    }

    const parsedAdults = toPositiveInt(adults, 2, { min: 1, max: 9 });

    console.log(`Train search: ${origin} -> ${destination}, ${departureDate} - ${returnDate}, ${parsedAdults} adults`);

    const result = await trainService.searchTrains(
      origin,
      destination,
      departureDate,
      returnDate,
      parsedAdults
    );

    if (!result) {
      return res.status(404).json({
        error: 'No train route available',
        message: `Train travel from ${origin} to ${destination} is not currently supported. Consider flying instead.`,
        flightAlternative: true
      });
    }

    res.json({
      success: true,
      data: result,
      disclaimer: 'Train prices are estimates based on typical fares. Actual prices shown on booking site.'
    });

  } catch (error) {
    console.error('Train search error:', error);
    res.status(500).json({
      error: 'Failed to search trains',
      message: error.message
    });
  }
});

/**
 * GET /api/trains/destinations
 *
 * Get all train-accessible destinations from London
 */
router.get('/destinations', (req, res) => {
  try {
    const destinations = trainService.getTrainDestinations();

    res.json({
      success: true,
      count: destinations.length,
      data: destinations,
      origin: 'London',
      note: 'Destinations reachable by Eurostar and connecting trains'
    });

  } catch (error) {
    console.error('Train destinations error:', error);
    res.status(500).json({
      error: 'Failed to get train destinations',
      message: error.message
    });
  }
});

/**
 * GET /api/trains/compare
 *
 * Compare train vs flight for a route
 *
 * Query params:
 * - origin: Origin city (default: London)
 * - destination: Destination city (required)
 * - departureDate: YYYY-MM-DD (required)
 * - returnDate: YYYY-MM-DD
 * - adults: Number of adults (default: 2)
 */
router.get('/compare', async (req, res) => {
  try {
    const {
      origin = 'London',
      destination,
      departureDate,
      returnDate,
      adults = 2
    } = req.query;

    if (!destination || !departureDate) {
      return res.status(400).json({
        error: 'destination and departureDate are required'
      });
    }

    const parsedAdults = toPositiveInt(adults, 2, { min: 1, max: 9 });

    const comparison = await trainService.compareTransport(
      origin,
      destination,
      departureDate,
      returnDate,
      parsedAdults
    );

    res.json({
      success: true,
      data: comparison
    });

  } catch (error) {
    console.error('Transport comparison error:', error);
    res.status(500).json({
      error: 'Failed to compare transport options',
      message: error.message
    });
  }
});

/**
 * GET /api/trains/link
 *
 * Generate booking link for train travel
 *
 * Query params:
 * - origin: Origin city
 * - destination: Destination city
 * - departureDate: YYYY-MM-DD
 * - returnDate: YYYY-MM-DD
 * - adults: Number of adults
 */
router.get('/link', (req, res) => {
  try {
    const {
      origin = 'London',
      destination,
      departureDate,
      returnDate,
      adults = 2
    } = req.query;

    if (!destination || !departureDate) {
      return res.status(400).json({
        error: 'destination and departureDate are required'
      });
    }

    const parsedAdults = toPositiveInt(adults, 2, { min: 1, max: 9 });

    const originCity = trainService.normalizeCity(origin);
    const destCity = trainService.normalizeCity(destination);

    const trainlineUrl = trainService.generateTrainlineUrl(
      originCity,
      destCity,
      departureDate,
      returnDate,
      parsedAdults
    );

    const omioUrl = trainService.generateOmioUrl(
      originCity,
      destCity,
      departureDate,
      returnDate,
      parsedAdults
    );

    if (!trainlineUrl && !omioUrl) {
      return res.status(404).json({
        error: 'No booking link available for this route'
      });
    }

    res.json({
      success: true,
      data: {
        primaryUrl: trainlineUrl || omioUrl,
        trainlineUrl,
        omioUrl,
        origin: originCity,
        destination: destCity
      }
    });

  } catch (error) {
    console.error('Train link error:', error);
    res.status(500).json({
      error: 'Failed to generate booking link',
      message: error.message
    });
  }
});

/**
 * GET /api/trains/check/:city
 *
 * Check if a city is reachable by train
 */
router.get('/check/:city', (req, res) => {
  const { city } = req.params;
  const normalizedCity = trainService.normalizeCity(city);
  const isAccessible = trainService.isTrainAccessible(normalizedCity);
  const stationInfo = trainService.getStationInfo(normalizedCity);

  res.json({
    success: true,
    city: normalizedCity,
    trainAccessible: isAccessible,
    station: stationInfo,
    journeyInfo: trainService.JOURNEY_TIMES[normalizedCity] || null
  });
});

module.exports = router;
