const express = require('express');
const bookingController = require('./../controllers/bookingController');
const authController = require('./../controllers/authController');

// Create a new router instance
const router = express.Router();

// Apply authentication middleware to all routes
router.use(authController.protect);

// Route for getting the checkout session for a specific tour
router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);

// Apply authorization middleware for admin and lead-guide roles
router.use(authController.restrictTo('admin', 'lead-guide'));

// Routes for handling bookings
router
  .route('/')
  .get(bookingController.getAllBookings) // Get all bookings
  .post(bookingController.createBooking); // Create a new booking

router
  .route('/:id')
  .get(bookingController.getBooking) // Get a specific booking by ID
  .patch(bookingController.updateBooking) // Update a specific booking by ID
  .delete(bookingController.deleteBooking); // Delete a specific booking by ID

module.exports = router;
