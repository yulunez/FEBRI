const express = require("express");
const router = express.Router();
const productoController = require("../control/productoContoller");

router.get("/:id", productoController.obtenerProductoPorId);
router.get('/top10', productoController.obtenerPrimerosDiez);

module.exports = router;