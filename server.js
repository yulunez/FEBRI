const express = require("express");
const mysql = require('mysql');

const app = express();
app.use(express.json());

// Configuración de conexión MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'febri', 
    port: 3307
});

// Conectar a la base de datos MySQL
db.connect((err) => {
    if (err) {
        console.error('Error de conexión MySQL:', err);
        return;
    }
    console.log('Conectado a la base de datos MySQL');
});

// Ruta de prueba con MySQL
app.get("/", (req, res) => {
    db.query('SELECT NOW() as fecha', (err, results) => {
        if (err) {
            console.error('Error en la consulta MySQL:', err);
            return res.status(500).send('Error en el servidor');
        }
        res.json(results);
    });
});

app.listen(3000, () => {
    console.log("Servidor corriendo en http://localhost:3000");
});