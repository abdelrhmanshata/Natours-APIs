const AppError = require('./../utils/appError');

// Handle MongoDB CastError when a field is provided with an invalid value (e.g., invalid ObjectId)
const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

// Handle MongoDB duplicate key error (e.g., when a unique field is duplicated)
const handleDuplicateFieldsDB = err => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  console.log(value);

  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

// Handle MongoDB validation errors for invalid input data
const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// Handle invalid JWT errors (e.g., when the JWT is malformed or tampered with)
const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

// Handle expired JWT errors (e.g., when the JWT has passed its expiration time)
const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

// Send detailed error information during development
const sendErrorDev = (err, req, res) => {
  // A) For API requests
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }

  // B) For rendered website requests
  console.error('ERROR 💥', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message
  });
};

// Send minimal error information in production for security
const sendErrorProd = (err, req, res) => {
  // A) For API requests
  if (req.originalUrl.startsWith('/api')) {
    // Operational errors are trusted and we can send detailed error information
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    // For programming or other unknown errors, log the error and send a generic message
    console.error('ERROR 💥', err);
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!'
    });
  }

  // B) For rendered website requests
  // Operational errors are trusted and we can send detailed error information
  if (err.isOperational) {
    console.log(err);
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message
    });
  }
  // For programming or other unknown errors, log the error and send a generic message
  console.error('ERROR 💥', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.'
  });
};

module.exports = (err, req, res, next) => {
  // Set default status code and status for the error
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Send detailed error in development environment
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    // Handle specific errors in production
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    // Send minimal error information in production
    sendErrorProd(error, req, res);
  }
};
