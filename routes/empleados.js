const express = require('express');
const router = express.Router();
const empleadosController = require('../control/empleadosController');

// Ruta para obtener la lista de empleados
router.get('/', empleadosController.obtenerEmpleados);
// Ruta para activar/desactivar un empleado
router.get('/toggle/:id', empleadosController.toggleEmpleadoActivo);
// Also accept PATCH for semantic toggle from the admin UI
router.patch('/toggle/:id', empleadosController.toggleEmpleadoActivo);
module.exports = router;