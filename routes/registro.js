const express = require('express');
const router = express.Router();
const usuarioController = require('../control/usuarioController');


router.post('/', usuarioController.registrarUsuario);

module.exports = router