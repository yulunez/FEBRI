const express = require("express");
const router = express.Router();
const productoController = require("../control/productoContoller");

// IMPORTANTE: Las rutas específicas DEBEN ir ANTES de las rutas con parámetros dinámicos (:id)
// para evitar que Express las interprete incorrectamente

// === RUTAS ESPECÍFICAS (sin parámetros) ===

// Top 10 productos
router.get('/primeros-diez', productoController.obtenerPrimerosDiez);
router.get('/top10', productoController.obtenerPrimerosDiez);

// Productos con descuento
router.get('/ofertas', productoController.obtenerProductosConDescuento);

// Productos para administrador
router.get('/admin', productoController.productosParaAdmin);
router.get('/admin/list', productoController.productosParaAdmin);

// Búsqueda de productos
router.get('/buscar', productoController.buscarProductos);

// === RUTAS DE FAVORITOS ===
router.get('/favorito', productoController.obtenerFavoritos);
router.post('/favorito', productoController.agregarFavorito);
router.delete('/favorito/:id', productoController.quitarFavorito);

// === RUTAS CON PARÁMETROS ===

// Productos por categoría
router.get('/categoria/:categoriaId', productoController.obtenerProductosPorCategoria);

// CRUD de productos
router.post('/', productoController.insertarProducto);
router.put('/:id', productoController.actualizarProducto);
router.get('/:id', productoController.obtenerProductoPorId);

// Obtener todos los productos (debe ir al final)
router.get('/', productoController.totalProductos);

module.exports = router;