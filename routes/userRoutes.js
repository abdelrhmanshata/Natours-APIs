const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

// Authentication routes
router.post('/signup', authController.signup); // User signup
router.post('/login', authController.login); // User login
router.get('/logout', authController.logout); // User logout

router.post('/forgotPassword', authController.forgotPassword); // Forgot password
router.patch('/resetPassword/:token', authController.resetPassword); // Password reset with token

// Protect all routes after this middleware
router.use(authController.protect);

// User routes that require authentication
router.patch('/updateMyPassword', authController.updatePassword); // Update password
router.get('/me', userController.getMe, userController.getUser); // Get current user details
router.patch(
  '/updateMe',
  userController.uploadUserPhoto, //Handle image uploads
  userController.resizeUserPhoto, // Resize images
  userController.updateMe, // Update user details
); // Update current user details
router.delete('/deleteMe', userController.deleteMe); // Delete current user

// Restrict routes to admin users only
router.use(authController.restrictTo('admin'));

// Admin routes
router
  .route('/')
  .get(userController.getAllUsers) // Get all users
  .post(userController.createUser); // Create a new user

router
  .route('/:id')
  .get(userController.getUser) // Get a user by ID
  .patch(userController.updateUser) // Update a user by ID
  .delete(userController.deleteUser); // Delete a user by ID

module.exports = router;
