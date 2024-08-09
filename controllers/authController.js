const { promisify } = require('util');
const { StatusCodes } = require('http-status-codes');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const path = require('path');

const catchAsync = require(path.join(__dirname, '../utils/catchAsync'));
const sendResponse = require(path.join(__dirname, '../utils/sendResponse'));
const User = require(path.join(__dirname, './../models/userModel'));
const AppError = require(path.join(__dirname, './../utils/appError'));
const Email = require(path.join(__dirname, './../utils/email'));

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createAndSendToken = (res, req, user, statusCode, data) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  };

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  sendResponse(res, statusCode, { token, ...data });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);

  // Send a welcome email to the new user
  if (process.env.NODE_ENV !== 'test') {
    const url = `${req.protocol}://${req.get('host')}/me`;
    const welcomeEmail = new Email(newUser, url);
    await welcomeEmail.sendWelcome();
  }

  createAndSendToken(res, req, newUser, StatusCodes.CREATED, { newUser });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1.) Verify email & password exist
  if (!email || !password) {
    next(new AppError('Please provide email and password', StatusCodes.BAD_REQUEST));
  }

  // 2.) Check if user exists & if password is correct
  const user = await User.findOne({ email }).select('+password');

  // 3.) If everything is valid, then respond with the JWT [JSON Web Token]
  if (!user) {
    return next(new AppError('The provided email is incorrect', StatusCodes.UNAUTHORIZED));
  }

  // 3.) Verify password in POST request is correct, then send back JWT
  if (!(await user.correctPassword(password, user.password))) {
    return next(new AppError('The provided password is incorrect', StatusCodes.UNAUTHORIZED));
  }

  createAndSendToken(res, req, user, StatusCodes.OK, { user });
});

/*
  Logs out a user by overriding their current JWT stored in browser's cookies
*/
exports.logout = (req, res, next) => {
  res.clearCookie('jwt');
  sendResponse(res, StatusCodes.OK);
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1. Get token from request and check if it is valid
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]; // Extracts JWT from the request (i.e. "<authorization, Bearer example-token-value>")
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt; // Extracts JWT from cookies that come with the request
  }

  if (!token) {
    return res.redirect('/');
  }

  // 2. Validate the JWT token [Verification]
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3. Check if user attempting to access route still exists
  const user = await User.findById(decoded.id);

  if (!user) {
    return next(
      new AppError('No user with a matching ID was located for that JWT.', StatusCodes.UNAUTHORIZED)
    );
  }

  // 4. Check if user changed password after JWT was issued
  const userChangedPassword = user.changedPasswordAfter(decoded.iat);
  if (userChangedPassword) {
    return next(
      new AppError(
        'Password was changed after JWT token was issued. Please login again.',
        StatusCodes.UNAUTHORIZED
      )
    );
  }

  // 5. Grant access to protected route
  req.user = user;
  res.locals.user = user;
  next();
});

// Only for rendered pages -- no errors.
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt === null) {
    return next();
  }

  if (req.cookies.jwt) {
    const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);

    // Check if user attempting to access route still exists
    const user = await User.findById(decoded.id);

    if (!user) {
      return next();
    }

    // Check if user changed password after JWT was issued
    const userChangedPassword = user.changedPasswordAfter(decoded.iat);
    if (userChangedPassword) {
      return next();
    }

    // Based on the above invariants, there's a logged in user
    res.locals.user = user;

    return next();
  }

  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles is an array (i.e. ['admin', 'lead-guide']). role='user'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', StatusCodes.FORBIDDEN)
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address.', StatusCodes.NOT_FOUND));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    // 3) Send it to user's email
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

    const passwordResetEmail = new Email(user, resetURL);
    await passwordResetEmail.sendPasswordReset();

    sendResponse(res, StatusCodes.OK, 'Token sent to email!');
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1.) Get user based on the token
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2.) Set the new password [if token is still valid and user exists]
  if (!user) {
    return next(
      new AppError('Password reset token is invalid or has expired', StatusCodes.BAD_REQUEST)
    );
  }

  // 3.) Update user document with changed password and changedPasswordAt property
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 4.) Login the user with new JWT
  createAndSendToken(res, req, user, StatusCodes.OK, { user });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1.) Verify request has correct fields
  const { passwordCurrent, password, passwordConfirm } = req.body;

  if (!passwordCurrent || !password || !passwordConfirm) {
    next(
      new AppError(
        'Please provide a new password, the old password, and a confirmation of the old password',
        StatusCodes.BAD_REQUEST
      )
    );
  }

  // 2.) Retrieve user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 3.) Verify password in POST request is correct, then send back JWT
  if (!(await user.correctPassword(passwordCurrent, user.password))) {
    return next(new AppError('The provided password is incorrect', StatusCodes.UNAUTHORIZED));
  }

  // 3.) If the password is correct, then update the pass word
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  await user.save();

  // 4.) Login the user with the new password and send back new JWT
  createAndSendToken(res, req, user, StatusCodes.OK);
});
