const express = require("express");

const router = express.Router();
const ventasController = require("../control/ventasController");
router.get("/", ventasController.mostrarVentas);
router.put("/:id", ventasController.actualizarEstadoVenta);
// Endpoint para métricas del día (total de ventas y ganancias)
router.get('/del-dia', ventasController.ventasDelDia);

router.get('/', ventasController.ventasDelDia);

module.exports = router;