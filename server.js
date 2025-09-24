const express = require("express");
const mysql = require('mysql');
const path = require('path');
const registroRouter = require('./routes/registro.js'); // Importa el router
const loginRouter = require('./routes/login.js');
const cors = require('cors'); // npm install cors
const session = require('express-session');// npm install express-session

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

// Configurar sesión
app.use(session({
    secret: 'clave_secreta_segura', // Cambia esto en producción
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // true solo si usas HTTPS
        maxAge: 1000 * 60 * 60 * 24 // 1 día
    }
}));

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


const login = require('./routes/login.js');
app.use('/login', login);

app.get('/perfil', (req, res) => {
    if (req.session.usuario) {
        res.json({
            success: true,
            usuario: req.session.usuario
        });
    } else {
        res.status(401).json({ success: false, message: 'No autorizado' });
    }
});

app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error al cerrar sesión' });
        }
        res.clearCookie('connect.sid'); // Limpia la cookie de sesión
        res.json({ success: true, message: 'Sesión cerrada' });
    });
});

// Iniciar el servidor  en el puerto 3000

app.listen(3000, () => {
    console.log("Servidor corriendo en http://localhost:3000");
});