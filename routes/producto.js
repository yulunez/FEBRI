const express = require("express");

const router = express.Router();
const productoController = require("../control/productoContoller");

// Register explicit routes first so they aren't captured by the param route
router.get('/primeros-diez', productoController.obtenerPrimerosDiez);
// Colocar la ruta de categoría ANTES de la genérica
router.get('/categoria/:categoriaId', productoController.obtenerProductosPorCategoria);
// Ruta para buscar productos
router.get('/buscar', productoController.buscarProductos);
router.get('/:id', productoController.obtenerProductoPorId);

module.exports = router;