/**
 * CheapAsTrips - Backend API
 *
 * This server:
 * - Holds API keys securely (never exposed to frontend)
 * - Queries Booking.com Flights/Skyscanner for flight prices (fallback to estimates)
 * - Queries Booking.com affiliate API for hotels (fallback to estimates)
 * - Combines results into holiday packages
 * - Returns clean JSON to frontend
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const flightRoutes = require('./routes/flights');
const hotelRoutes = require('./routes/hotels');
const packageRoutes = require('./routes/packages');
const trainRoutes = require('./routes/trains');
const addonRoutes = require('./routes/addons');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET'],
  credentials: true
}));

// Rate limiting - prevent abuse
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Parse JSON
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/flights', flightRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/trains', trainRoutes);
app.use('/api/addons', addonRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    error: 'Something went wrong',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`✈️ CheapAsTrips API running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);

  const hasBookingFlights = Boolean(process.env.BOOKING_FLIGHTS_RAPIDAPI_KEY || process.env.RAPIDAPI_KEY);
  const hasSkyscanner = Boolean(process.env.RAPIDAPI_KEY);
  if (!hasBookingFlights && !hasSkyscanner) {
    console.warn('⚠️  No flight API keys configured. Using estimated flight prices.');
    console.warn('   Set BOOKING_FLIGHTS_RAPIDAPI_KEY (or RAPIDAPI_KEY) in .env for live prices.');
  }
});
