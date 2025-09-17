const express = require('express');
const router = express.Router();
const usuarioController = require('../control/usuarioController');

router.post('/registro', usuarioController.registrarUsuario);

module.exports = router