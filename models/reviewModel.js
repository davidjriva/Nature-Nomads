const mongoose = require('mongoose');
const path = require('path');

const Tour = require(path.join(__dirname, 'tourModel'));

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A review must have an associated author'],
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'A review must have an associated tour'],
    },
    review: {
      type: String,
      required: [true, 'A review must have a body'],
      maxLength: [1000, 'A review can have a maximum size of 1000 characters.'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'A review must have an associated rating of the tour'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      required: [true, 'A review must have a timestamp'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Prevents the same user from leaving multiple reviews. Each user-tour combination must be unique.
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// Populate the user and tour field on find queries
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const avgStats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (avgStats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: avgStats[0].nRating,
      ratingsAverage: avgStats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

/*
  Calculate the average review rating for a tour
*/
reviewSchema.post('save', function () {
  this.constructor.calcAverageRatings(this.tour._id);
});

/*
  Passing state from pre -> post middleware to calculate average ratings on change (i.e. update or delete review)
*/
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  await this.r.constructor.calcAverageRatings(this.r.tour._id);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
