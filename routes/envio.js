const express = require('express');
const router = express.Router();
const envioController = require('../control/envioController');

router.post('/', envioController.generarEnvio);
router.get('/', envioController.obtenerEnviosPorCliente);

module.exports = router;