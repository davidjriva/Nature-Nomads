const { StatusCodes } = require('http-status-codes');
const path = require('path');
const { error } = require('console');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const sendResponse = require(path.join(__dirname, '../utils/sendResponse'));
const catchAsync = require(path.join(__dirname, '../utils/catchAsync'));
const Booking = require(path.join(__dirname, '../models/bookingModel'));
const Tour = require(path.join(__dirname, '../models/tourModel'));
const factory = require(path.join(__dirname, '../controllers/handlerFactory'));

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  error('Getting a checkout session...');
  // Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);

  error(`Getting a checkout session for ${tour.name} -- ${tour._id}`);
  // Create checkout session with Stripe
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.description,
            images: [`${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`],
          },
        },
      },
    ],
    mode: 'payment',
  });

  sendResponse(res, StatusCodes.OK, session);
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  const { tour, user, price } = req.query;

  if (!tour && !user && !price) {
    return next();
  }

  await Booking.create({ tour, user, price });

  // Redirect and remove the query string [obfuscation]
  res.redirect(req.originalUrl.split('?')[0]);
});

// CRUD operations
exports.getAllBookings = factory.getAll(Booking);

exports.getBooking = factory.getOne(Booking);

exports.createBooking = factory.createOne(Booking);

exports.createBookingManually = factory.createOne(Booking);

exports.updateBooking = factory.updateOne(Booking);

exports.deleteBooking = factory.deleteOne(Booking);
