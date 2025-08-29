const express = require('express');
const mysql = require('mysql');

const router = express.Router();

// Configura tu conexión a la base de datos
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'febri'
});

// Conectar a la base de datos
db.connect((err) => {
    if (err) {
        console.error('Error de conexión:', err);
        return;
    }
    console.log('Conectado a la base de datos');
});

// Ruta para consultar la tabla rol
router.get('/consulta-rol', (req, res) => {
    db.query('SELECT * FROM rol', (err, results) => {
        if (err) {
            console.error('Error en la consulta:', err);
            return res.status(500).send('Error en la consulta');
        }
        console.log('Consulta a la tabla rol:', results);
        res.json(results);
    });
});

module.exports = router;