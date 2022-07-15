const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Ticket must belong to a user'],
    },
    order: {
      type: mongoose.Schema.ObjectId,
      ref: 'Order',
      required: [true, 'Ticket must belong to a user'],
    },

    type: {
      type: String,
      required: [true, 'Ticket must have an type'],
      enum: ['refund', 'exchange'],
      default: 'exchange',
      lowercase: true,
    },

    description: {
      type: String,
      maxlength: [50, 'description must be shorter than 50 characters.'],
      required: [true, 'Please provide your reason.'],
      lowercase: true,
      trim: true,
    },
  },
  { timestamps: true }
);

//----------QUERY MIDDLEWARE-------------//
ticketSchema.pre(/^find/, function (next) {
  this.populate({ path: 'user', select: 'name email' }).populate({
    path: 'order',
    select: 'shoes amount status',
  });
  next();
});

const Ticket = mongoose.model('Ticket', ticketSchema);
module.exports = Ticket;
