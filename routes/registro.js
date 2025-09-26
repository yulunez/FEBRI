const express = require('express');
const router = express.Router();
const registroController = require('../control/registroController');


router.post('/', registroController.registrarUsuario);

module.exports = router