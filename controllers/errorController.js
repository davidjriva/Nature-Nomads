const { StatusCodes } = require('http-status-codes');
const path = require('path');

const AppError = require(path.join(__dirname, '../utils/appError'));

const sendError = (res, req, err, additionalInfo) => {
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      ...additionalInfo,
    });
  } else {
    res.status(err.statusCode).render('error', {
      title: 'Something Went Wrong...',
      msg: err.message,
    });
  }
};

const sendSimpleError = (res, req, err) => {
  if (req.originalUrl.startsWith('/api')) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Something went wrong!',
    });
  } else {
    res.status(err.statusCode).render('error', {
      title: 'Something Went Wrong...',
      msg: 'Please try again later.',
    });
  }
};

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, StatusCodes.BAD_REQUEST);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value.`;

  return new AppError(message, StatusCodes.BAD_REQUEST);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data. Errors: ${errors.join('. ')}`;
  return new AppError(message, StatusCodes.BAD_REQUEST);
};

const handleJsonWebTokenError = () => {
  return new AppError('Invalid JWT token. Please log in again!', StatusCodes.UNAUTHORIZED);
};

const handleTokenExpiredError = () => {
  return new AppError('JWT token has expired. Please log in again!', StatusCodes.UNAUTHORIZED);
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendError(res, req, err, { error: err, stack: err.stack });
  } else if (process.env.NODE_ENV === 'production') {
    let error = Object.assign(err);

    // sendError: operational error that we trust
    // sendSimpleError: unknown error --> don't leave details to the client
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJsonWebTokenError();
    if (error.name === 'TokenExpiredError') error = handleTokenExpiredError();

    error.isOperational ? sendError(res, req, error) : sendSimpleError(res, req, error);
  }

  next();
};
