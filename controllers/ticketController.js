const Ticket = require('../models/ticketModel');
const APIFeatures = require('../utilities/APIFeatures');

//----------HANDLERS------------//
exports.newTicket = async (req, res, next) => {
  try {
    const newTicket = await Ticket.create({
      user: req.user.id,
      order: req.body.order,
      type: req.body.type,
      description: req.body.description,
    });

    newTicket.__v = undefined;
    res.status(201).json({ status: 'success', data: newTicket });
  } catch (err) {
    next(err);
  }
};
exports.getAllTickets = async (req, res, next) => {
  try {
    const ApiFeatures = new APIFeatures(Ticket.find(), req.query)
      .filter()
      .sort()
      .fields()
      .paginate();
    const tickets = await ApiFeatures.query;
    res.status(200).json({
      status: 'success',
      results: tickets.length,
      data: tickets,
    });
  } catch (err) {
    next(err);
  }
};
