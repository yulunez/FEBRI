const express = require("express");
const router = express.Router();
const perfilController = require("../control/perfilController")

router.post("/editar/:id, perfilController.editarUsuario");

module.exports = router;