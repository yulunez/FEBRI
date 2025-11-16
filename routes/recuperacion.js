const express = require('express');
const router = express.Router();
const recuperacionController = require('../control/recuperacionController');

// Solicitar recuperación de contraseña
router.post('/solicitar', recuperacionController.solicitarRecuperacion);

// Validar token de recuperación
router.post('/validar', recuperacionController.validarToken);

// Cambiar contraseña
router.post('/cambiar-password', recuperacionController.cambiarPassword);

module.exports = router;