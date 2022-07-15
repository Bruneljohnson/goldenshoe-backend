const User = require('../models/userModel');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const AppError = require('../utilities/AppError');
const HelperFn = require('../utilities/HelpersFn');
const SendEmail = require('../utilities/Email');

//----------REFACTOR TOKEN-------------//

const signToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRESIN,
  });
};

const sendToken = (res, user, statusCode) => {
  const token = signToken(user);

  user.password = undefined;
  user.active = undefined;
  user.__v = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: statusCode === 201 ? user : user._id,
  });
};

//----------AUTHENTICATION HANDLERS-------------//

exports.signup = async (req, res, next) => {
  try {
    const user = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
      passwordChangedAt: req.body.passwordChangedAt,
    });

    //Create Email Token and send email to Verify user email.
    HelperFn.sendVerifyEmail(user, res);
  } catch (err) {
    next(err);
  }
};

//Handler to verify user email and allow user to login.
exports.verifyEmail = async (req, res, next) => {
  try {
    const hashedEmailToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      emailToken: hashedEmailToken,
      emailTokenExpiresIn: { $gt: Date.now() },
    });

    if (!user) return next(new AppError('Invalid or Expired Email Token', 401));

    user.emailVerified = true;
    user.emailToken = undefined;
    user.emailTokenExpiresIn = undefined;
    //Document Middleware validation is required as passwords are involved
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      message: 'Your Email has been Verified. Please log in.',
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return next(new AppError('Please provide your email and password', 400));

    //use select() to make available hidden fields
    const user = await User.findOne({ email }).select(
      '+password emailVerified'
    );
    if (!user || !(await user.comparePassword(password, user.password)))
      return next(new AppError('Incorrect email or password.', 401));

    //only verified users can access the application.
    if (user.emailVerified) {
      sendToken(res, user, 200);
    } else {
      //if not  verified we resend email verifyToken.
      HelperFn.sendVerifyEmail(user, res);
    }
  } catch (err) {
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return next(new AppError("User doesn't exist.", 404));

    const resetToken = user.createResetToken();
    //For our Document Middleware to work we have to use the Save() method.
    await user.save({ validateBeforeSave: false });

    const username = user.name
      .split(' ')[0]
      .replace(user.name[0], user.name[0].toUpperCase());

    try {
      if (process.env.NODE_ENV === 'production') {
        await SendEmail({
          email,
          subject: 'Here Is Your Password Reset Token. [Valid For 10mins.]',
          preheader: 'Let Us Get You Logged In.',
          url: `https://bruneljohnson.github.io/goldenshoe/resetPassword/${resetToken}`,
          name: username,
          resetToken,
          message: `Here is your reset token ${resetToken}`,
          templateKey: process.env.EMAIL_RESET_PASSWORD_TEMPLATE_KEY,
        });
      } else {
        await SendEmail({
          email,
          subject: 'Your Password Reset Token (Valid for 10mins)',
          message: resetToken,
        });
      }
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpiresIn = undefined;
      await user.save({ validateBeforeSave: false });
      return next(new AppError('Server Error sending email.', 500));
    }

    res.status(200).json({
      status: 'success',
      message: 'Your password reset token has been sent to your email',
    });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { password, confirmPassword } = req.body;
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpiresIn: { $gt: Date.now() },
    });

    if (!user) return next(new AppError('Invalid or Expired Reset Token', 401));

    user.password = password;
    user.confirmPassword = confirmPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpiresIn = undefined;
    //Document Middleware validation is required as passwords are involved
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Your Password has been updated. Please Log In.',
    });
  } catch (err) {
    next(err);
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, password, confirmPassword } = req.body;
    if (!currentPassword || !password || !confirmPassword)
      return next(new AppError('Please provide your password', 400));

    const user = await User.findById(req.user.id).select('+password');

    if (!(await user.comparePassword(currentPassword, user.password)))
      return next(new AppError('Invalid password.', 401));

    //In order for our document middleware to work we have to use save()
    //and not findByIdAndUpdate
    user.password = password;
    user.confirmPassword = confirmPassword;
    await user.save();

    //Send token to check that user is authentic
    // sendToken(res, user, 200);
    res.status(200).json({
      status: 'success',
      message: 'Your Password has been updated.',
    });
  } catch (err) {
    next(err);
  }
};

//----------AUTHORISATION MIDDLEWARE-------------//

exports.protected = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    )
      token = req.headers.authorization.split(' ')[1];

    if (!token) return new AppError('You are not logged in', 401);

    const decodedToken = await promisify(jwt.verify)(
      token,
      process.env.JWT_SECRET
    );

    const currentUser = await User.findById(decodedToken.id);
    if (!currentUser)
      return next(
        new AppError('The user belonging to this token no longer exists.', 401)
      );

    if (currentUser.passwordChangedAfter(decodedToken.iat))
      return next(
        new AppError('Password recently updated. Please log in.', 401)
      );

    req.user = currentUser;
    next();
  } catch (err) {
    next(err);
  }
};
