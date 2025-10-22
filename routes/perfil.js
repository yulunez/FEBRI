const express = require("express");
const router = express.Router();
const perfilController = require("../control/perfilController");

// Ruta para crear perfil (usuarios nuevos de Google/Facebook)
router.post("/crear", perfilController.crearPerfil);

// Ruta para editar perfil existente
router.post("/editar/:id", perfilController.editarUsuario);

module.exports = router;