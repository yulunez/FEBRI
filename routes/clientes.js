const express = require('express');

const router = express.Router();
const clientesController = require('../control/clientesController');
router.get('/', clientesController.mostrarClientes);
router.get('/total-ventas', clientesController.mostrarTotalVentasporCliente);
// Ventas por cliente
router.get('/:id/ventas', clientesController.mostrarVentasPorCliente);
// Alternar activo/suspendido del cliente (intenta usar columna Activo; si no existe, usa Estado)
router.put('/:id/toggle', clientesController.toggleClienteActivo);

module.exports = router;