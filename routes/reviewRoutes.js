const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

// Create a new router instance with merged params
const router = express.Router({ mergeParams: true });

// Apply authentication middleware to all routes
router.use(authController.protect);

// Route for getting all reviews and creating a new review
router
  .route('/')
  .get(reviewController.getAllReviews) // Get all reviews
  .post(
    authController.restrictTo('user'), // Restrict creation to authenticated users
    reviewController.setTourUserIds, // Set tour and user IDs for the review
    reviewController.createReview, // Create a new review
  );

// Route for getting, updating, and deleting a specific review by ID
router
  .route('/:id')
  .get(reviewController.getReview) // Get a specific review by ID
  .patch(
    authController.restrictTo('user', 'admin'), // Restrict update to users and admins
    reviewController.updateReview, // Update a specific review by ID
  )
  .delete(
    authController.restrictTo('user', 'admin'), // Restrict deletion to users and admins
    reviewController.deleteReview, // Delete a specific review by ID
  );

module.exports = router;
