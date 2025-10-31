const express = require('express');
const router = express.Router();
const materiaPrimaController = require('../control/materiaprimaController');

// Ruta para obtener todas las materias primas
router.get('/', materiaPrimaController.MostrarMateriaPrima);
// Ruta para obtener materia prima por id
router.get('/:id', materiaPrimaController.MostrarMateriaPrimaById);
// Ruta para crear nueva materia prima
router.post('/', materiaPrimaController.CrearMateriaPrima);
// Ruta para actualizar materia prima existente
router.put('/:id', materiaPrimaController.ActualizarMateriaPrima);

module.exports = router;