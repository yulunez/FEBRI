const express = require('express');

const router = express.Router();
const clientesController = require('../control/clientesController');
router.get('/', clientesController.mostrarClientes);

module.exports = router;