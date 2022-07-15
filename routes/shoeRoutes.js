const express = require('express');
const ShoeController = require('../controllers/shoeController');

const router = express.Router();

router.get('/', ShoeController.getAllShoes);
router.get('/:id', ShoeController.getShoe);

// Future create admin Routes

module.exports = router;
