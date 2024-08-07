const express = require('express');
const path = require('path');

const viewController = require(path.join(__dirname, '../controllers/viewController'));
const authController = require(path.join(__dirname, '../controllers/authController'));
const bookingController = require(path.join(__dirname, '../controllers/bookingController'));

const router = express.Router();

// Get user information to display on site
router.get('/me', authController.protect, viewController.getAccount);

router.get('/my-tours', authController.protect, viewController.getMyTours);

// Check if user is logged in via JWT in their cookies
router.use(authController.isLoggedIn);

router.get('/', bookingController.createBookingCheckout, viewController.getOverview);

router.get('/tour/:slug', viewController.getTour);

router.get('/login', viewController.getLoginForm);

module.exports = router;
