const express = require('express');
const router = express.Router();
const carroController = require('../control/carroController');

// Ruta para agregar un producto al carro de compra
router.post('/agregar', carroController.agregarAlCarro);

// Ruta para obtener el contenido del carro de compra
router.get('/', carroController.obtenerCarro);
// Ruta para eliminar un producto del carro de compra
router.post('/eliminar', carroController.eliminarDelCarro);
module.exports = router;