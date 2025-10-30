const express = require('express');
const router = express.Router();
const enviosController = require('../control/enviosController');
const mysql = require('mysql');

// Middleware para inyectar conexión (siguiendo tu patrón)
router.use((req, res, next) => {
    req.db = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'febri',
        port: 3306
    });
    next();
});

router.get('/usuario', enviosController.obtenerEnviosUsuario);

module.exports = router;