const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewRouter = require('./../routes/reviewRoutes');

const router = express.Router();

// Mount review routes on `/tours/:tourId/reviews`
router.use('/:tourId/reviews', reviewRouter);

// Route for getting top 5 cheap tours
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

// Route for getting tour statistics
router.route('/tour-stats').get(tourController.getTourStats);

// Route for getting monthly tour plan for a specific year
router.route('/monthly-plan/:year').get(
  authController.protect, // Ensure the user is authenticated
  authController.restrictTo('admin', 'lead-guide', 'guide'), // Restrict access to certain roles
  tourController.getMonthlyPlan,
);

// Route for getting tours within a certain distance from a center point
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);
// Example: /tours-within?distance=233&center=-40,45&unit=mi
// Example: /tours-within/233/center/-40,45/unit/mi

// Route for getting distances from a specific point
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

// Routes for CRUD operations on tours
router
  .route('/')
  .get(tourController.getAllTours) // Get all tours
  .post(
    authController.protect, // Ensure the user is authenticated
    authController.restrictTo('admin', 'lead-guide'), // Restrict access to certain roles
    tourController.createTour,
  ); // Create a new tour

router
  .route('/:id')
  .get(tourController.getTour) // Get a specific tour by ID
  .patch(
    authController.protect, // Ensure the user is authenticated
    authController.restrictTo('admin', 'lead-guide'), // Restrict access to certain roles
    tourController.uploadTourImages, // Handle image uploads
    tourController.resizeTourImages, // Resize images
    tourController.updateTour,
  ) // Update a specific tour by ID
  .delete(
    authController.protect, // Ensure the user is authenticated
    authController.restrictTo('admin', 'lead-guide'), // Restrict access to certain roles
    tourController.deleteTour,
  ); // Delete a specific tour by ID

module.exports = router;
