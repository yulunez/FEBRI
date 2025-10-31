const express = require('express');
const router = express.Router();
const comprasController = require('../control/comprasController');

router.post('/', comprasController.realizarCompra);

module.exports = router;