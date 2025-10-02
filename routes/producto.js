const express = require("express");
const router = express.Router();
const productoController = require("../control/productoContoller");

router.get("/:id", productoController.obtenerProductoPorId);

module.exports = router;