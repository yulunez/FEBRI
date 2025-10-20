const express = require("express");

const router = express.Router();
const categoriasController = require("../control/categoriasController");

router.get("/", categoriasController.mostrarCategorias);

module.exports = router;