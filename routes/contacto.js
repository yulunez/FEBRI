const express = require("express");
const router = express.Router();
const contactoController = require("../control/contactoController");

// Enviar mensaje de contacto a WhatsApp del dueño
router.post("/enviar", contactoController.enviar);

module.exports = router;