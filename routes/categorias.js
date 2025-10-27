const express = require("express");

const router = express.Router();
const categoriasController = require("../control/categoriasController");

router.get("/", categoriasController.mostrarCategorias);
// Crear nueva categoría
router.post("/", categoriasController.insertarCategoria);

module.exports = router;