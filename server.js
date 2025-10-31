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

// Middleware de parseo
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger simple para debugging
app.use((req, res, next) => {
    console.log(new Date().toISOString(), req.method, req.originalUrl);
    next();
});

// Configuración de conexión MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'febri', 
    port: 3306
});

// Conectar a la base de datos MySQL
db.connect((err) => {
    if (err) {
        console.error('Error de conexión MySQL:', err);
        return;
    }
    console.log('Conectado a la base de datos MySQL');
});

// Configurar sesión
app.use(session({
    secret: process.env.SESSION_SECRET || 'clave_secreta_segura',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 1000 * 60 * 60 * 24 // 24 horas
    }
}));

// Inicializar Passport
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

// Configurar Passport OAuth
const oauthController = require('./control/oauthController');
oauthController.configurePassport(db);

// ============================================
// IMPORTAR RUTAS
// ============================================
const loginRoutes = require('./routes/login');
const registroRoutes = require('./routes/registro');
const perfilRoutes = require('./routes/perfil');
const perfilUsuarioRoutes = require('./routes/perfilUsuario');
const categoriasRoutes = require('./routes/categorias');
const productoRoutes = require('./routes/producto');
const oauthRoutes = require('./routes/oauth');
const recuperacionRoutes = require('./routes/recuperacion');
const contactoRoutes = require('./routes/contacto');
const enviosRoutes = require('./routes/envios');
const ventasRoutes = require('./routes/ventas');
const clientesRoutes = require('./routes/clientes');
const estadisticasRoutes = require('./routes/estadisticas');
const excelRoutes = require('./routes/excel');
const empleadosRoutes = require('./routes/empleados');
const materiaPrimaRoutes = require('./routes/materiaPrima');
const proveedoresRoutes = require('./routes/proveedores');

// ============================================
// USAR RUTAS
// ============================================
app.use('/login', loginRoutes);
app.use('/registro', registroRoutes);
app.use('/perfil', perfilRoutes);
app.use('/perfil-usuario', perfilUsuarioRoutes);
app.use('/perfilUsuario', perfilUsuarioRoutes); // Alias para compatibilidad
app.use('/categorias', categoriasRoutes);
app.use('/productos', productoRoutes);
app.use('/producto', productoRoutes); // Alias para compatibilidad
app.use('/auth', oauthRoutes);
app.use('/recuperar', recuperacionRoutes);
app.use('/contacto', contactoRoutes);
app.use('/envios', enviosRoutes);
app.use('/ventas', ventasRoutes);
app.use('/clientes', clientesRoutes);
app.use('/estadisticas', estadisticasRoutes);
app.use('/excel', excelRoutes);
app.use('/empleados', empleadosRoutes);
app.use('/materiaPrima', materiaPrimaRoutes);
app.use('/proveedores', proveedoresRoutes);

// ============================================
// RUTAS ADICIONALES
// ============================================

// Verificar sesión
app.get('/verificar-sesion', (req, res) => {
    if (req.session && req.session.usuario) {
        res.json({ 
            autenticado: true, 
            usuario: req.session.usuario 
        });
    } else {
        res.json({ autenticado: false });
    }
});

const carroRouter = require('./routes/carro.js');
app.use('/carro', carroRouter);

const comprasRouter = require('./routes/compras.js');   
app.use('/compras', comprasRouter);

const envioRouter = require('./routes/envio.js');
app.use('/envio', envioRouter);

app.use(express.urlencoded({ extended:true }));
const perfilUsuarioRouter = require('./routes/perfilUsuario.js');
const perfilRouter = require('./routes/perfil.js');
// ...existing code...
app.use('/perfilUsuario', perfilUsuarioRouter);
app.use('/perfil', perfilRouter);

app.get('/perfilUsuario', (req, res) => {
    if (req.session && req.session.usuario) {
        res.json({
            success: true,
            usuario: req.session.usuario
        });
    } else {
        res.json({ 
            success: false, 
            message: 'No hay sesión activa' 
        });
    }
});

// Cerrar sesión
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
            return res.json({ 
                success: false, 
                message: 'Error al cerrar sesión' 
            });
        }
        res.clearCookie('connect.sid');
        return res.json({ success: true });
    });
});


// ============================================
// INICIAR SERVIDOR
// ============================================
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Debug helper (temporary): return session info so we can verify the session seen by different pages
app.get('/debug-session', (req, res) => {
    res.json({
        ok: true,
        sessionID: req.sessionID,
        session: req.session,
        cookieHeader: req.headers && req.headers.cookie
    });
});


app.listen(PORT, HOST, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(`Para acceder desde celular: http://192.168.1.6:${PORT}`);
});

// Manejo de errores no capturados
process.on('uncaughtException', (err) => {
    console.error('Error no capturado:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Promesa rechazada no manejada:', reason);
});