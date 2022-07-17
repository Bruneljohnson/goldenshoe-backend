const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Order must belong to a user'],
    },

    shoes: [
      {
        shoe: { type: mongoose.Schema.ObjectId, ref: 'Shoe' },
        size: { type: String },
        quantity: { type: Number, default: 1 },
      },
    ],
    amount: { type: Number, required: [true, 'Order must have an amount'] },
    shipping: {
      type: Object,
      required: [true, 'Address is required for order.'],
    },
    status: { type: String, default: 'Pending' },
  },
  { timestamps: true }
);

//----------VIRTUALLY POPULATE-------------//
orderSchema.virtual('tickets', {
  ref: 'Ticket',
  foreignField: 'order',
  localField: '_id',
});

//----------QUERY MIDDLEWARE-------------//
orderSchema.pre(/^find/, function (next) {
  this.populate('user').populate({
    path: 'shoes.shoe',
    select: 'title image colour price',
  });
  next();
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
