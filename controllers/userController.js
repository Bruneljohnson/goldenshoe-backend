const User = require('../models/userModel');
const AppError = require('../utilities/AppError');
const HelperFn = require('../utilities/HelpersFn');

//----------GET USER DATA ME MIDDLEWARE------------//
exports.getMe = async (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

//----------HANDLERS------------//

exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate({
      path: 'orders',
      select: '-__v ',
    });

    if (!user) {
      return next(new AppError("User doesn't exisit", 404));
    }

    user.__v = undefined;

    res.status(200).json({
      status: 'success',
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateMe = async (req, res, next) => {
  try {
    if (req.body.password || req.body.confirmPassword)
      return next(
        new AppError(
          'This is not the route to update userPasswords. Please use /updatePassword',
          400
        )
      );

    const filteredBody = HelperFn.filterObj(req.body, 'name', 'email');

    const user = await User.findByIdAndUpdate(req.user.id, filteredBody, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: 'success',
      message: "You've successfully updated your details.",
      data: { data: user },
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteMe = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.user.id);

    res.status(204).json({ status: 'success' });
  } catch (err) {
    next(err);
  }
};
