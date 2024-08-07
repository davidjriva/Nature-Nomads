const path = require('path');

const Review = require(path.join(__dirname, '../models/reviewModel'));
const factory = require(path.join(__dirname, './handlerFactory'));

// CRUD functionality for Review resource
exports.getReviews = factory.getAll(Review);

exports.setTourUserIds = (req, res, next) => {
  if (!req.body.tour) {
    req.body.tour = req.params.tourId;
  }

  if (!req.body.user) {
    req.body.user = req.user.id;
  }

  next();
};

exports.createReview = factory.createOne(Review);

exports.deleteReview = factory.deleteOne(Review);

exports.updateReview = factory.updateOne(Review);

exports.getReview = factory.getOne(Review);
