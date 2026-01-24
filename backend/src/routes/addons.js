/**
 * Add-ons Routes
 *
 * API endpoints for travel add-ons powered by Klook affiliate links.
 * Covers tours, activities, insurance, car rentals, transfers, etc.
 */

const express = require('express');
const router = express.Router();
const addonsService = require('../services/addons');
const restaurantsService = require('../services/restaurants');

const toPositiveInt = (value, fallback, { min = 0, max } = {}) => {
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  const clamped = Math.max(min, parsed);
  return typeof max === 'number' ? Math.min(clamped, max) : clamped;
};

/**
 * GET /api/addons/categories
 *
 * Get all available add-on categories
 */
router.get('/categories', (req, res) => {
  try {
    const categories = addonsService.getAllCategories();

    res.json({
      success: true,
      count: categories.length,
      data: categories,
      affiliateLink: addonsService.KLOOK_AFFILIATE_BASE
    });

  } catch (error) {
    console.error('Categories error:', error);
    res.status(500).json({
      error: 'Failed to get categories',
      message: error.message
    });
  }
});

/**
 * GET /api/addons/city/:city
 *
 * Get add-ons available for a specific city
 */
router.get('/city/:city', (req, res) => {
  try {
    const { city } = req.params;
    const addons = addonsService.getAddonsForCity(city);

    res.json({
      success: true,
      data: addons
    });

  } catch (error) {
    console.error('City addons error:', error);
    res.status(500).json({
      error: 'Failed to get city add-ons',
      message: error.message
    });
  }
});

/**
 * GET /api/addons/insurance
 *
 * Get travel insurance options
 *
 * Query params:
 * - destination: City name
 * - nights: Trip duration
 * - travelers: Number of travelers (default: 1)
 */
router.get('/insurance', (req, res) => {
  try {
    const {
      destination,
      nights = 4,
      travelers = 1
    } = req.query;

    if (!destination) {
      return res.status(400).json({ error: 'destination is required' });
    }

    const parsedNights = toPositiveInt(nights, 4, { min: 1, max: 90 });
    const parsedTravelers = toPositiveInt(travelers, 1, { min: 1, max: 10 });

    const insurance = addonsService.getInsuranceOptions(
      destination,
      parsedNights,
      parsedTravelers
    );

    res.json({
      success: true,
      data: insurance
    });

  } catch (error) {
    console.error('Insurance error:', error);
    res.status(500).json({
      error: 'Failed to get insurance options',
      message: error.message
    });
  }
});

/**
 * GET /api/addons/car-rental
 *
 * Get car rental options
 *
 * Query params:
 * - destination: City name
 * - pickupDate: YYYY-MM-DD
 * - returnDate: YYYY-MM-DD
 * - drivers: Number of drivers (default: 1)
 */
router.get('/car-rental', (req, res) => {
  try {
    const {
      destination,
      pickupDate,
      returnDate,
      drivers = 1
    } = req.query;

    if (!destination || !pickupDate || !returnDate) {
      return res.status(400).json({
        error: 'destination, pickupDate, and returnDate are required'
      });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(pickupDate) || !dateRegex.test(returnDate)) {
      return res.status(400).json({
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    const parsedDrivers = toPositiveInt(drivers, 1, { min: 1, max: 5 });

    const carRental = addonsService.getCarRentalOptions(
      destination,
      pickupDate,
      returnDate,
      parsedDrivers
    );

    res.json({
      success: true,
      data: carRental
    });

  } catch (error) {
    console.error('Car rental error:', error);
    res.status(500).json({
      error: 'Failed to get car rental options',
      message: error.message
    });
  }
});

/**
 * GET /api/addons/transfers
 *
 * Get airport transfer options
 *
 * Query params:
 * - destination: City name
 * - travelers: Number of travelers (default: 2)
 */
router.get('/transfers', (req, res) => {
  try {
    const {
      destination,
      travelers = 2
    } = req.query;

    if (!destination) {
      return res.status(400).json({ error: 'destination is required' });
    }

    const parsedTravelers = toPositiveInt(travelers, 2, { min: 1, max: 20 });

    const transfers = addonsService.getTransferOptions(destination, parsedTravelers);

    res.json({
      success: true,
      data: transfers
    });

  } catch (error) {
    console.error('Transfers error:', error);
    res.status(500).json({
      error: 'Failed to get transfer options',
      message: error.message
    });
  }
});

/**
 * GET /api/addons/bundle/:city
 *
 * Get bundled add-ons for a package deal
 *
 * Query params:
 * - nights: Trip duration (default: 4)
 * - adults: Number of adults (default: 2)
 */
router.get('/bundle/:city', (req, res) => {
  try {
    const { city } = req.params;
    const { nights = 4, adults = 2 } = req.query;

    const parsedNights = toPositiveInt(nights, 4, { min: 1, max: 28 });
    const parsedAdults = toPositiveInt(adults, 2, { min: 1, max: 9 });

    const bundle = addonsService.bundleAddonsForPackage(city, parsedNights, parsedAdults);

    res.json({
      success: true,
      data: bundle
    });

  } catch (error) {
    console.error('Bundle error:', error);
    res.status(500).json({
      error: 'Failed to get add-ons bundle',
      message: error.message
    });
  }
});

/**
 * GET /api/addons/restaurants
 *
 * Get restaurant recommendations for a city (TripAdvisor)
 *
 * Query params:
 * - city: City name (required)
 * - limit: Number of results (default: 6)
 */
router.get('/restaurants', async (req, res) => {
  try {
    const { city, limit = 6 } = req.query;

    if (!city) {
      return res.status(400).json({ error: 'city is required' });
    }

    const parsedLimit = toPositiveInt(limit, 6, { min: 1, max: 20 });
    const results = await restaurantsService.searchRestaurants(city, { limit: parsedLimit });

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Restaurants error:', error);
    res.status(500).json({
      error: 'Failed to get restaurants',
      message: error.message
    });
  }
});

/**
 * GET /api/addons/link
 *
 * Generate affiliate link for a category
 *
 * Query params:
 * - city: City name (optional)
 * - category: Category ID (optional)
 */
router.get('/link', (req, res) => {
  try {
    const { city, category } = req.query;

    const link = addonsService.generateKlookLink(city, category);

    res.json({
      success: true,
      data: {
        link,
        city: city || null,
        category: category || null
      }
    });

  } catch (error) {
    console.error('Link generation error:', error);
    res.status(500).json({
      error: 'Failed to generate link',
      message: error.message
    });
  }
});

module.exports = router;
