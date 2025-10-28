const express = require('express');

const router = express.Router();
const excelController = require('../control/excelController');

router.get('/descargar-resultados', excelController.descargarResultados);

module.exports = router;