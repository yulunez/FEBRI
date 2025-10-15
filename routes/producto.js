const express = require("express");

const router = express.Router();
const productoController = require("../control/productoContoller");

// Register explicit routes first so they aren't captured by the param route
router.get('/top10', productoController.obtenerPrimerosDiez);
router.get('/:id', productoController.obtenerProductoPorId);

module.exports = router;