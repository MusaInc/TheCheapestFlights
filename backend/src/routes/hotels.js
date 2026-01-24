/**
 * Hotel Routes
 *
 * Endpoints for hotel search and affiliate links.
 * Returns Booking.com affiliate URLs for commission tracking.
 */

const express = require('express');
const router = express.Router();
const hotelService = require('../services/hotels');

/**
 * GET /api/hotels/search
 *
 * Search for hotels in a city
 *
 * Query params:
 * - city: City name (required)
 * - checkin: YYYY-MM-DD (required)
 * - checkout: YYYY-MM-DD (required)
 * - adults: number (default: 2)
 */
router.get('/search', async (req, res) => {
  try {
    const {
      city,
      checkin,
      checkout,
      adults = 2
    } = req.query;

    // Validation
    if (!city || !checkin || !checkout) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['city', 'checkin', 'checkout']
      });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(checkin) || !dateRegex.test(checkout)) {
      return res.status(400).json({
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);
    if (!(checkinDate instanceof Date) || Number.isNaN(checkinDate.getTime())) {
      return res.status(400).json({ error: 'Invalid checkin date' });
    }
    if (!(checkoutDate instanceof Date) || Number.isNaN(checkoutDate.getTime())) {
      return res.status(400).json({ error: 'Invalid checkout date' });
    }
    if (checkoutDate <= checkinDate) {
      return res.status(400).json({
        error: 'Checkout must be after checkin'
      });
    }

    const parsedAdults = parseInt(adults, 10);
    const sanitizedAdults = Number.isFinite(parsedAdults) && parsedAdults > 0 ? parsedAdults : 2;

    const results = await hotelService.searchHotels(
      city,
      checkin,
      checkout,
      sanitizedAdults
    );

    const hasLiveHotels = Boolean(process.env.RAPIDAPI_KEY && process.env.RAPIDAPI_HOST);
    const requireLiveHotels = process.env.REQUIRE_LIVE_HOTELS === 'true' && hasLiveHotels;
    if (requireLiveHotels && results.source !== 'rapidapi') {
      return res.status(404).json({
        error: 'Live hotel data required but unavailable for this search',
        city
      });
    }

    res.json({
      success: true,
      data: results,
      disclaimer: 'Hotel prices shown on Booking.com. Subject to availability.'
    });

  } catch (error) {
    console.error('Hotel search error:', error);
    res.status(500).json({
      error: 'Failed to search hotels',
      message: error.message
    });
  }
});

/**
 * GET /api/hotels/link
 *
 * Generate a Booking.com affiliate search link
 */
router.get('/link', (req, res) => {
  const {
    city,
    checkin,
    checkout,
    adults = 2
  } = req.query;

  if (!city || !checkin || !checkout) {
    return res.status(400).json({
      error: 'Missing required parameters',
      required: ['city', 'checkin', 'checkout']
    });
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(checkin) || !dateRegex.test(checkout)) {
    return res.status(400).json({
      error: 'Invalid date format. Use YYYY-MM-DD'
    });
  }

  const checkinDate = new Date(checkin);
  const checkoutDate = new Date(checkout);
  if (!(checkinDate instanceof Date) || Number.isNaN(checkinDate.getTime())) {
    return res.status(400).json({ error: 'Invalid checkin date' });
  }
  if (!(checkoutDate instanceof Date) || Number.isNaN(checkoutDate.getTime())) {
    return res.status(400).json({ error: 'Invalid checkout date' });
  }
  if (checkoutDate <= checkinDate) {
    return res.status(400).json({
      error: 'Checkout must be after checkin'
    });
  }

  const affiliateId = process.env.BOOKING_AFFILIATE_ID || '';
  const parsedAdults = parseInt(adults, 10);
  const sanitizedAdults = Number.isFinite(parsedAdults) && parsedAdults > 0 ? parsedAdults : 2;
  const searchUrl = hotelService.generateBookingSearchUrl(
    city,
    checkin,
    checkout,
    sanitizedAdults,
    affiliateId
  );

  res.json({
    success: true,
    url: searchUrl,
    disclaimer: 'This link redirects to Booking.com where you can complete your booking.'
  });
});

/**
 * GET /api/hotels/estimate
 *
 * Get estimated hotel price for a city
 */
router.get('/estimate', (req, res) => {
  const { city, nights = 4 } = req.query;

  if (!city) {
    return res.status(400).json({
      error: 'City parameter required'
    });
  }

  const parsedNights = parseInt(nights, 10);
  const sanitizedNights = Number.isFinite(parsedNights) && parsedNights > 0 ? parsedNights : 4;
  const estimate = hotelService.calculateHotelEstimate(city, sanitizedNights);

  res.json({
    success: true,
    data: {
      city,
      nights: sanitizedNights,
      ...estimate
    },
    disclaimer: 'These are estimated prices. Actual prices shown on Booking.com.'
  });
});

module.exports = router;
