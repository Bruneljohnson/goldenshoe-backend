const express = require('express');
const AuthController = require('../controllers/authController');
const TicketController = require('../controllers/ticketController');

const router = express.Router();

router.use(AuthController.protected);

router.post('/', TicketController.newTicket);
router.get('/', TicketController.getAllTickets);

// Future create admin Routes
module.exports = router;
