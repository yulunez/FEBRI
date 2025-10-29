const express = require("express");

const router = express.Router();
const productoController = require("../control/productoContoller");

// Register explicit routes first so they aren't captured by the param route
router.get('/top10', productoController.obtenerPrimerosDiez);
// Endpoint para dashboard/administrador que devuelve todos los productos necesarios para el admin
// Ruta alternativa no ambigua para evitar colisiones con '/:id'
router.get('/admin', productoController.productosParaAdmin);
router.get('/admin/list', productoController.productosParaAdmin);
router.get('/categoria/:categoriaId', productoController.obtenerProductosPorCategoria);
// Crear producto
router.post('/', productoController.insertarProducto);
// Favoritos en sesión
router.get('/favorito', productoController.obtenerFavoritos);
router.post('/favorito', productoController.agregarFavorito);
router.delete('/favorito/:id', productoController.quitarFavorito);
// Actualizar producto
router.put('/:id', productoController.actualizarProducto);
router.get('/:id', productoController.obtenerProductoPorId);


router.get('/', productoController.totalProductos)
module.exports = router;