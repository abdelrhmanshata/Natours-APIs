const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');

// Function to sign a JWT token with a user's ID
const signToken = (id) => {
  return jwt.sign(
    {
      id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    },
  );
};

// Function to create and send a JWT token as a cookie
// This function also removes the password from the user object before sending the response
const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true, // Cookie cannot be accessed or modified by the client-side JavaScript
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https', // Send the cookie only in secure connections (HTTPS)
  });

  // Remove password from output
  user.password = undefined;
  // Send response with status code, token, and user data
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

// Middleware to protect routes by verifying the JWT token
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  // If no token is found, return an error
  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401),
    );
  }

  // 2) Verify the token's validity
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if the user still exists in the database
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401,
      ),
    );
  }

  // 4) Check if the user has changed their password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401),
    );
  }

  // Grant access to the protected route by attaching the user to the request object
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// Middleware to check if a user is logged in for rendered pages (without throwing errors)
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );

      // 2) Check if the user still exists in the database
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) Check if the user has changed their password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      /// If there is a logged-in user, attach the user to the response's locals object
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

// Middleware to restrict access to certain roles (e.g., admin, lead-guide)
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // If the user's role is not included in the allowed roles, return an error
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }
    next();
  };
};

////////////////////////////////////////////////////////////////////////////////////////////////

// Signup new user
exports.signup = catchAsync(async (req, res, next) => {
  // Create a new user with the provided details
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
  // Create a URL for the welcome email and send the email
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();
  // Generate and send JWT token to the user
  createSendToken(newUser, 201, req, res);
});

// Login existing user
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password are provided
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  // 2) Check if user exists and password is correct
  const user = await User.findOne({
    email,
  }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) If authentication is successful, send JWT token to client
  createSendToken(user, 200, req, res);
});

// Logout user by setting a short-lived cookie
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000), // Cookie expires in 10 seconds
    httpOnly: true, // Cookie cannot be accessed by client-side scripts
  });
  res.status(200).json({
    status: 'success',
  });
};

// Handle forgotten password requests
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Find the user based on the provided email
  const user = await User.findOne({
    email: req.body.email,
  });
  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }

  // 2) Generate a password reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({
    validateBeforeSave: false,
  });

  // 3) Send the reset token to the user's email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host',
    )}/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    // If sending email fails, reset the token and expiration date
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({
      validateBeforeSave: false,
    });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500,
    );
  }
});

// Reset user password using the token sent via email
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Hash the token and find the user by the token and check expiration
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }, // Check if token is still valid
  });

  // 2) If the token is valid and user exists, update the password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update the user's password changed timestamp
  // 4) Log the user in, send new JWT token
  createSendToken(user, 200, req, res);
});

// Update user password when logged in
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get the current user from the database
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if the current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // 3) If correct, update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // Note: User.findByIdAndUpdate will NOT work because it bypasses the middleware

  // 4) Log the user in with the new password, send JWT token
  createSendToken(user, 200, req, res);
});
