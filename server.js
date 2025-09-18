const express = require("express");
const mysql = require('mysql');
const path = require('path');
const registroRouter = require('./routes/registro.js'); // Importa el router
const cors = require('cors'); // npm install cors

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

app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
    credentials: true
}));

app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    req.db = db;
    next();
});

// Conectar a la base de datos MySQL
db.connect((err) => {
    if (err) {
        console.error('Error de conexión MySQL:', err);
        return;
    }
    console.log('Conectado a la base de datos MySQL');
});


const registro = require('./routes/registro');
app.use('/registro', registro); // Usa el router para la ruta /registro

// Iniciar el servidor  en el puerto 3000

app.listen(3000, () => {
    console.log("Servidor corriendo en http://localhost:3000");
});