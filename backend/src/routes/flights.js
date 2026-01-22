/**
 * Flight Routes
 *
 * Endpoints for searching flights via Amadeus API.
 * All prices returned are REAL from the API.
 */

const express = require('express');
const router = express.Router();
const amadeusService = require('../services/amadeus');
const { DEFAULT_ORIGIN } = require('../config/destinations');

/**
 * GET /api/flights/search
 *
 * Search for flights to a specific destination
 *
 * Query params:
 * - destination: IATA code (required)
 * - departureDate: YYYY-MM-DD (required)
 * - returnDate: YYYY-MM-DD (required)
 * - adults: number (default: 2)
 * - origin: IATA code (default: LON)
 */
router.get('/search', async (req, res) => {
  try {
    const {
      destination,
      departureDate,
      returnDate,
      adults = 2,
      origin = DEFAULT_ORIGIN
    } = req.query;

    // Validation
    if (!destination || !departureDate || !returnDate) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['destination', 'departureDate', 'returnDate']
      });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(departureDate) || !dateRegex.test(returnDate)) {
      return res.status(400).json({
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    const flight = await amadeusService.searchFlights(
      origin,
      destination,
      departureDate,
      returnDate,
      parseInt(adults)
    );

    if (!flight) {
      return res.status(404).json({
        error: 'No flights found',
        destination,
        dates: { departureDate, returnDate }
      });
    }

    res.json({
      success: true,
      data: flight,
      disclaimer: 'Prices are provided by Amadeus and subject to availability.'
    });

  } catch (error) {
    console.error('Flight search error:', error);
    res.status(500).json({
      error: 'Failed to search flights',
      message: error.message
    });
  }
});

/**
 * GET /api/flights/inspiration
 *
 * Get cheapest flight destinations from origin
 * Uses Amadeus Flight Inspiration Search
 */
router.get('/inspiration', async (req, res) => {
  try {
    const { origin = DEFAULT_ORIGIN } = req.query;

    const destinations = await amadeusService.searchFlightInspiration(origin);

    res.json({
      success: true,
      data: destinations,
      count: destinations.length,
      disclaimer: 'Prices are provided by Amadeus and subject to availability.'
    });

  } catch (error) {
    console.error('Flight inspiration error:', error);
    res.status(500).json({
      error: 'Failed to get flight inspiration',
      message: error.message
    });
  }
});

module.exports = router;
