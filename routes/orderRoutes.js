const express = require('express');
const OrderController = require('../controllers/orderController');
const AuthController = require('../controllers/authController');

const router = express.Router();

router.post('/', OrderController.webhook);

router.use(AuthController.protected);

router.get('/orders', OrderController.getAllOrders);
router.get('/orders/:id', OrderController.getOrder);

router.post('/checkout-session', OrderController.getCheckoutSession);

// Future create admin Routes

module.exports = router;
