const express = require('express');
const router = express.Router();
const loginController = require('../control/loginController');


router.post('/', loginController.ingresarUsuario);

module.exports = router