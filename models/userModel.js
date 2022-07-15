const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const crypto = require('crypto');

//----------CREATE SCHEMA-------------//
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name.'],
      minlength: [3, 'User name must be greater or equal to 3 characters.'],
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Users must have an email address.'],
      validate: [validator.isEmail, 'Please provide a valid email address.'],
      lowercase: true,
      unique: [true, 'Email Address already exists.'],
      trim: true,
    },

    role: {
      type: String,
      select: false,
      enum: ['user', 'admin'],
      default: 'user',
    },
    password: {
      type: String,
      min: [8, 'password must be equal or greater than 8 characters.'],
      required: [true, 'Please provide a password.'],
      select: false,
    },
    confirmPassword: {
      type: String,
      required: [true, 'Please confirm password.'],
      validate: {
        validator: function (val) {
          return val === this.password;
        },
        message: 'Passwords do not match.',
      },
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    emailVerified: { type: Boolean, default: false, select: false },

    passwordChangedAt: {
      type: Date,
      select: false,
    },
    emailToken: { type: String },
    emailTokenExpiresIn: {
      type: Date,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpiresIn: {
      type: Date,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

//----------VIRTUALLY POPULATE-------------//
userSchema.virtual('orders', {
  ref: 'Order',
  foreignField: 'user',
  localField: '_id',
});

//----------DOCUMENT MIDDLEWARE-------------//

//For saving and modifying password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.confirmPassword = undefined;
  next();
});
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

//----------QUERY MIDDLEWARE-------------//
//To filter inactive users
userSchema.pre(/^find/, async function (next) {
  this.find({ active: { $ne: false } });

  next();
});

//----------INSTANCE METHODS-------------//
//To verify passwords (userpassword is saved on DB, password is inputted at login)
userSchema.methods.comparePassword = async function (password, userPassword) {
  return await bcrypt.compare(password, userPassword);
};

//To verify user at login (using JWT iat)
userSchema.methods.passwordChangedAfter = function (jwtTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = Number.parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return jwtTimeStamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpiresIn = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

userSchema.methods.createEmailToken = function () {
  const emailToken = crypto.randomBytes(32).toString('hex');

  this.emailToken = crypto
    .createHash('sha256')
    .update(emailToken)
    .digest('hex');

  this.emailTokenExpiresIn = Date.now() + 60 * 60 * 1000;

  return emailToken;
};

//----------CREATE USER MODEL-------------//
const User = mongoose.model('User', userSchema);
module.exports = User;
