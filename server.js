// Cargar variables de entorno PRIMERO
require('dotenv').config();

const express = require("express");
const mysql = require('mysql');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de conexión MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'febri', 
    port: 3306
});

// Configurar sesión
app.use(session({
    secret: process.env.SESSION_SECRET || 'clave_secreta_segura',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 1000 * 60 * 60 * 24
    }
}));

// INICIALIZAR PASSPORT
app.use(passport.initialize());
app.use(passport.session());

// Configurar CORS
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'http://192.168.1.6:3000',
        'http://192.168.1.6:5500'
    ],
    credentials: true
}));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para acceder a la base de datos en las rutas
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

// Configurar Passport OAuth
const oauthController = require('./control/oauthController');
oauthController.configurePassport(db);

// Importar rutas
const loginRoutes = require('./routes/login');
const registroRoutes = require('./routes/registro');
const perfilRoutes = require('./routes/perfil');
const perfilUsuarioRoutes = require('./routes/perfilUsuario');
const categoriasRoutes = require('./routes/categorias');
const productoRoutes = require('./routes/producto');
const oauthRoutes = require('./routes/oauth');
const recuperacionRoutes = require('./routes/recuperacion');
const contactoRoutes = require('./routes/contacto');

// Usar rutas
app.use('/login', loginRoutes);
app.use('/registro', registroRoutes);
app.use('/perfil', perfilRoutes);
app.use('/perfil-usuario', perfilUsuarioRoutes);
app.use('/categorias', categoriasRoutes);
app.use('/productos', productoRoutes);
app.use('/auth', oauthRoutes);
app.use('/recuperar', recuperacionRoutes);
app.use('/contacto', contactoRoutes);

// Ruta para verificar si el usuario ha iniciado sesión
app.get('/verificar-sesion', (req, res) => {
    if (req.session && req.session.usuario) {
        res.json({ autenticado: true, usuario: req.session.usuario });
    } else {
        res.json({ autenticado: false });
    }
});

// Ruta para cerrar sesión
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.json({ success: false, message: 'Error al cerrar sesión' });
        }
        res.clearCookie('connect.sid');
        return res.json({ success: true });
    });
});

// Iniciar el servidor
app.listen(3000, '0.0.0.0', () => {
    console.log("Servidor corriendo en http://localhost:3000");
    console.log("Para acceder desde celular: http://192.168.1.6:3000");
});
