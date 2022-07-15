const SendEmail = require('./Email');

exports.filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  allowedFields.forEach((field) => {
    if (allowedFields.includes(field)) newObj[field] = obj[field];
  });

  return newObj;
};

exports.sendVerifyEmail = async (user, res) => {
  try {
    const emailToken = user.createEmailToken();
    await user.save({ validateBeforeSave: false });

    const username = user.name
      .split(' ')[0]
      .replace(user.name[0], user.name[0].toUpperCase());

    try {
      if (process.env.NODE_ENV === 'production') {
        await SendEmail({
          email: user.email,
          subject: 'Please Verify Your Email Address. [Valid For One Hour.]',
          preheader: 'The World Awaits You.',
          url: `https://bruneljohnson.github.io/goldenshoe/verifyemail/${emailToken}`,
          name: username,
          templateKey: process.env.EMAIL_VERIFY_TEMPLATE_KEY,
        });
      } else {
        await SendEmail({
          email: user.email,
          subject: 'Please Verify Your Email. (Valid for One Hour)',
          message: `Here is your email token ${emailToken}`,
        });
      }
    } catch (err) {
      user.emailToken = undefined;
      user.emailTokenExpiresIn = undefined;
      await user.save({ validateBeforeSave: false });
      return next(new AppError('Server Error sending email.', 500));
    }

    res.status(200).json({
      status: 'success',
      data: user.emailVerified,
      message:
        'Please VERIFY your email address. A verifyTOKEN has been sent to your email.',
    });
  } catch (err) {
    next(err);
  }
};
