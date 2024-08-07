const { StatusCodes } = require('http-status-codes');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');

const sendResponse = require(path.join(__dirname, '../utils/sendResponse'));
const catchAsync = require(path.join(__dirname, '../utils/catchAsync'));
const AppError = require(path.join(__dirname, '../utils/appError'));
const Tour = require(path.join(__dirname, '../models/tourModel'));
const factory = require(path.join(__dirname, './handlerFactory'));

const multerStorage = multer.memoryStorage();

// Filters out any non-image files
const multerFilter = (req, file, callback) => {
  if (file.mimetype.startsWith('image')) {
    callback(null, true);
  } else {
    callback(new AppError('Uploaded file is not an image. Please upload only images', StatusCodes.BAD_REQUEST), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) {
    return next();
  }

  // Process cover image
  req.body.imageCover = `tour-${req.params.id}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // Process remaining three images
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, idx) => {
      const filename = `tour-${req.params.id}-${idx + 1}.jpeg`;

      await sharp(file.buffer).resize(2000, 1333).toFormat('jpeg').jpeg({ quality: 90 }).toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    })
  );

  next();
};

// CRUD functionality for Tour resource
exports.getTours = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour, { path: 'reviews' });

exports.createTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);

// Geospatial query for tours within a certain distance to the user
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radians = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    return next(new AppError('Please provide latitude and longitude in the format lat,lng', StatusCodes.BAD_REQUEST));
  }

  const tours = await Tour.find({
    startLocation: {
      $geoWithin: {
        $centerSphere: [[lng, lat], radians],
      },
    },
  });

  sendResponse(res, StatusCodes.OK, { tours, results: tours.length });
});

// Calculates distances from a location to all other tours
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const distanceMultiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    return next(new AppError('Please provide latitude and longitude in the format lat,lng', StatusCodes.BAD_REQUEST));
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  sendResponse(res, StatusCodes.OK, { distances, results: distances.length });
});

// Additional routes for data analysis features
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getTourStats = catchAsync(async (req, res) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);

  sendResponse(res, StatusCodes.OK, stats);
});

// Uses an aggregation pipeline to calculate the number of tours per month for a specific year
// Returns the number of tours per month sorted in descending order
exports.getMonthlyPlan = catchAsync(async (req, res) => {
  const year = parseInt(req.params.year);

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: {
        month: '$_id',
      },
    },
    {
      $project: { _id: 0 },
    },
    {
      $sort: { numTourStarts: -1 },
    },
  ]);

  sendResponse(res, StatusCodes.OK, plan);
});
