const express = require('express');
const router = express.Router();
const descuentoController = require('../control/descuentoController');

// Ruta para obtener todos los descuentos
router.get('/', descuentoController.establecerDescuento);

module.exports = router;