const express = require("express");

const router = express.Router();
const ventasController = require("../control/ventasController");
router.get("/", ventasController.mostrarVentas);
router.put("/:id", ventasController.actualizarEstadoVenta);

module.exports = router;