const Shoe = require('../models/shoeModel');
const APIFeatures = require('../utilities/APIFeatures');
const AppError = require('../utilities/AppError');

//----------HANDLERS------------//
exports.getAllShoes = async (req, res, next) => {
  try {
    const ApiFeatures = new APIFeatures(Shoe.find(), req.query)
      .filter()
      .sort()
      .fields()
      .paginate();
    const shoes = await ApiFeatures.query;
    res.status(200).json({
      status: 'success',
      results: shoes.length,
      data: shoes,
    });
  } catch (err) {
    next(err);
  }
};

exports.getShoe = async (req, res, next) => {
  try {
    const shoe = await Shoe.findById(req.params.id);
    if (!shoe) return next(new AppError("Shoe doesn't exist.", 404));

    res.status(200).json({ status: 'success', data: shoe });
  } catch (error) {
    next(err);
  }
};
