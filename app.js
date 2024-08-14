const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');
const { xss } = require('express-xss-sanitizer');

const AppError = require(path.join(__dirname, 'utils/appError'));
const globalErrorHandler = require(path.join(__dirname, 'controllers/errorController'));

const tourRouter = require(path.join(__dirname, 'routes/tourRoutes'));
const userRouter = require(path.join(__dirname, 'routes/userRoutes'));
const reviewRouter = require(path.join(__dirname, 'routes/reviewRoutes'));
const viewRouter = require(path.join(__dirname, 'routes/viewRoutes'));
const bookingRouter = require(path.join(__dirname, 'routes/bookingRoutes'));

const app = express();

// Trust proxies [Heroku]
app.enable('trust proxy');

// Template Engine Setup (Views):
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

/*
  --------------------
   GLOBAL MIDDLEWARES
  --------------------
*/
// Implement CORS
app.use(cors());

app.options('*', cors());

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP Headers
app.use(helmet());

// Logging middleware [dev only]
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); //Morgan: Logging Middleware
}

// Limit Requests - Prevents the max number of requests per IP address
// App crashes/shutdowns reset the rate limiter
const limiter = rateLimit({
  max: 250,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests are coming from this IP, please try again in an hour.',
  keyGenerator: (req) => req.ip,
  skip: (req) => req.app.get('trust proxy') === false,
});
app.use('/api', limiter);

// Body parsers - reading data from the body into req.body
app.use(express.json({ limit: '10kb' })); // Adds the body into the request object as JSON.
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // Allow requests from HTML forms
app.use(cookieParser()); // Parses the data from cookies [JWT] --> access via 'req.cookie'

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS attacks
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ], // properties where duplicates are allowed in query string
  })
);

// Compression - reduces the size of outgoing data
app.use(compression());

// ALLOW REQUESTS TO unpkg.com and cdnjs.cloudflare.com (Leaflet & Stripe)
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "script-src \
    'self' \
    https://unpkg.com/leaflet@1.9.4/dist/leaflet.css \
    https://unpkg.com/leaflet@1.9.4/dist/leaflet.js \
    https://js.stripe.com/v3/"
  );
  next();
});

// ROUTES
// test route for seeing if server is running
app.use('/', viewRouter);
app.post('/test-route', (req, res) => {
  res.status(200).send({});
});
app.get('/ping-route', (req, res) => {
  res.status(200).send({ ping: 'pong' });
});
app.use('/api/v1/bookings', bookingRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// Handling missing routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, StatusCodes.NOT_FOUND));
});

app.use(globalErrorHandler);

module.exports = app;
