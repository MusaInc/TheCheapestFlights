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

    const results = await hotelService.searchHotels(
      city,
      checkin,
      checkout,
      parseInt(adults)
    );

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

  const affiliateId = process.env.BOOKING_AFFILIATE_ID || '';
  const searchUrl = hotelService.generateBookingSearchUrl(
    city,
    checkin,
    checkout,
    parseInt(adults),
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

  const estimate = hotelService.calculateHotelEstimate(city, parseInt(nights));

  res.json({
    success: true,
    data: {
      city,
      nights: parseInt(nights),
      ...estimate
    },
    disclaimer: 'These are estimated prices. Actual prices shown on Booking.com.'
  });
});

module.exports = router;
