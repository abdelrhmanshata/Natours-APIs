class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    // Set the HTTP status code for the error
    this.statusCode = statusCode;

    // Determine the status of the error ('fail' for 4xx codes, 'error' for 5xx codes)
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    // Mark this error as operational (vs. programming or unknown errors)
    this.isOperational = true;

    // Capture the stack trace, excluding the constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
