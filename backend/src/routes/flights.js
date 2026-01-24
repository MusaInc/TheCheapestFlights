/**
 * Flight Routes
 *
 * Endpoints for searching flights via Booking.com/Skyscanner/estimates.
 * Prices may be real or estimated based on source availability.
 */

const express = require('express');
const router = express.Router();
const flightService = require('../services/flights');
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

    const departure = new Date(departureDate);
    const inbound = new Date(returnDate);
    if (!(departure instanceof Date) || Number.isNaN(departure.getTime())) {
      return res.status(400).json({ error: 'Invalid departure date' });
    }
    if (!(inbound instanceof Date) || Number.isNaN(inbound.getTime())) {
      return res.status(400).json({ error: 'Invalid return date' });
    }
    if (inbound <= departure) {
      return res.status(400).json({
        error: 'Return date must be after departure date'
      });
    }

    const iataRegex = /^[A-Z]{3}$/;
    const originCode = String(origin).trim().toUpperCase();
    const destinationCode = String(destination).trim().toUpperCase();
    if (!iataRegex.test(originCode) || !iataRegex.test(destinationCode)) {
      return res.status(400).json({
        error: 'Invalid IATA code. Use 3-letter airport or city codes.'
      });
    }

    const parsedAdults = parseInt(adults, 10);
    const sanitizedAdults = Number.isFinite(parsedAdults) && parsedAdults > 0 ? parsedAdults : 2;

    const flight = await flightService.searchFlights(
      originCode,
      destinationCode,
      departureDate,
      returnDate,
      sanitizedAdults
    );

    const hasLiveFlights = Boolean(
      process.env.BOOKING_FLIGHTS_RAPIDAPI_KEY || process.env.RAPIDAPI_KEY
    );
    const requireLiveFlights = process.env.REQUIRE_LIVE_FLIGHTS === 'true' && hasLiveFlights;
    if (flight && requireLiveFlights && flight.isRealPrice === false) {
      return res.status(404).json({
        error: 'Live flight data required but unavailable for this search',
        destination,
        dates: { departureDate, returnDate }
      });
    }

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
      disclaimer: flight.isRealPrice
        ? 'Prices are provided by live sources and subject to availability.'
        : 'Prices are estimated. Click through to see live availability.'
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
 * Uses estimated pricing with live booking links
 */
router.get('/inspiration', async (req, res) => {
  try {
    const { origin = DEFAULT_ORIGIN } = req.query;

    const destinations = await flightService.searchFlightInspiration(origin);

    res.json({
      success: true,
      data: destinations,
      count: destinations.length,
      disclaimer: 'Prices are estimated. Click through to see live availability.'
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
