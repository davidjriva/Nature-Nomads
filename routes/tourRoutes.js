const express = require('express');
const path = require('path');

const tourController = require(path.join(__dirname, '../controllers/tourController'));
const authController = require(path.join(__dirname, '../controllers/authController'));
const reviewRouter = require(path.join(__dirname, '../routes/reviewRoutes'));

const router = express.Router();

// Nested Route: Transfers requests to /tours/:tourId/reviews to the review router
router.use('/:tourId/reviews', reviewRouter);

router.route('/top-5-cheap')
    .get(tourController.aliasTopTours, tourController.getTours);

router.route('/tour-stats')
    .get(tourController.getTourStats);

router.route('/monthly-plan/:year')
    .get(authController.protect, authController.restrictTo('admin', 'guide', 'lead-guide'), tourController.getMonthlyPlan);

router.route('/tours-within/:distance/center/:latlng/unit/:unit')
    .get(tourController.getToursWithin);

router.route('/distances/:latlng/unit/:unit')
    .get(tourController.getDistances);

router.route('/')
    .get(tourController.getTours)
    .post(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.createTour);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.uploadTourImages, tourController.resizeTourImages, tourController.updateTour)
  .delete(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.deleteTour);

module.exports = router;
