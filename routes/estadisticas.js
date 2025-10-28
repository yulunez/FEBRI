const express = require('express');

const router = express.Router();
const estadisticasController = require('../control/estadisticasController');

// Fix: controller exports 'productoMasVendido' (singular)
router.get('/producto-mas-vendido', estadisticasController.productoMasVendido);
router.get('/ventas-por-mes', estadisticasController.ventasPorMes);

module.exports = router;