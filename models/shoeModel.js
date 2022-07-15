const mongoose = require('mongoose');

const shoeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Shoes must have a title.'],
      unique: true,
    },
    description: {
      type: String,
      require: [true, 'Shoes must have a description.'],
    },
    image: {
      type: [String],
    },
    sizes: {
      type: [Object],
      required: [true, 'Shoes must have a size.'],
    },
    categories: {
      type: Array,
      required: [true, 'Shoes must be within a category.'],
    },
    shoeType: {
      type: String,
      enum: ['hi-top', 'low-top', 'slip-on'],
    },
    price: {
      type: Number,
      required: [true, 'Shoes must have a price.'],
    },
    countInStock: {
      type: Number,
      required: [true, 'Stock is required.'],
    },
    colour: {
      type: String,
      required: [true, 'Shoes must have a colour.'],
    },
  },
  {
    timestamps: true,
  }
);

const Shoe = mongoose.model('Shoe', shoeSchema);

module.exports = Shoe;
