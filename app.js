const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const compression = require('compression');
const cors = require('cors');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const bookingController = require('./controllers/bookingController');

// Start express app
const app = express();

// Enable trust proxy for apps behind a proxy (e.g., Nginx, HAProxy, AWS ELB)
app.set('trust proxy', 1); // Trust the first proxy

// 1) GLOBAL MIDDLEWARES
// Implement CORS to allow cross-origin requests
app.use(cors());
// Allow complex requests for all routes
app.options('*', cors());

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headers using Helmet to protect against well-known web vulnerabilities
app.use(helmet());

// Enable logging in development environment
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit the number of requests from the same IP to prevent denial-of-service attacks
const limiter = rateLimit({
  max: 100, // Max 100 requests per IP
  windowMs: 60 * 60 * 1000, // Per hour
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter); // Apply rate limiting to all API routes

// Handle Stripe webhook before the body is parsed by body-parser
app.post(
  '/webhook-checkout',
  bodyParser.raw({ type: 'application/json' }), // Use raw body for Stripe
  bookingController.webhookCheckout,
);

// Parse incoming JSON requests and limit the body size to 10kb
app.use(express.json({ limit: '10kb' }));
// Parse URL-encoded data and limit the body size to 10kb
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
// Parse cookies in the request
app.use(cookieParser());

// Data sanitization against NoSQL query injection attacks
app.use(mongoSanitize());

// Data sanitization against cross-site scripting (XSS) attacks
app.use(xss());

// Prevent HTTP parameter pollution by filtering out duplicate query parameters
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

// Compress responses to improve performance
app.use(compression());

// Custom middleware to log the request time (useful for debugging)
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString(); // Add request time to req object
  next();
});

// 3) ROUTES
// Mount tour, user, review, and booking routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// Handle all undefined routes with a 404 error
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(globalErrorHandler);

module.exports = app;
