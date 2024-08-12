const { StatusCodes } = require('http-status-codes');
const path = require('path');

const catchAsync = require(path.join(__dirname, '../utils/catchAsync'));
const AppError = require(path.join(__dirname, '../utils/appError'));
const sendResponse = require(path.join(__dirname, '../utils/sendResponse'));
const APIFeatures = require(path.join(__dirname, '../utils/apiFeatures'));

// Generic factory methods for frequently used CRUD operations across the API
exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc)
      return next(
        new AppError(`No document found with the ID ${req.params.id}`, StatusCodes.NOT_FOUND)
      );

    sendResponse(res, StatusCodes.NO_CONTENT, null);
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc)
      return next(
        new AppError(`No document found with the ID ${req.params.id}`, StatusCodes.NOT_FOUND)
      );

    sendResponse(res, StatusCodes.OK, doc);
  });
1;

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    console.log(req.body);
    const newDoc = await Model.create(req.body);

    sendResponse(res, StatusCodes.CREATED, newDoc);
  });

exports.getOne = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOptions) {
      query = query.populate(populateOptions);
    }

    const doc = await query;

    if (!doc) {
      return next(
        new AppError(`No document found with the ID ${req.params.id}`, StatusCodes.NOT_FOUND)
      );
    }

    sendResponse(res, StatusCodes.OK, doc);
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // Measuring query performance -> add the .explain() modifier to the query and it will return performance details to the endpoint
    const docs = await features.query;

    sendResponse(res, StatusCodes.OK, { docs, results: docs.length });
  });
