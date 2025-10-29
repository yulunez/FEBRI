const express = require('express');
const router = express.Router();
const passport = require('passport');

// Ruta para iniciar autenticación con Google
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Callback de Google
router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login.html' }),
    (req, res) => {
        console.log('=== CALLBACK GOOGLE ===');
        console.log('Usuario autenticado:', req.user);
        
        // Guardar usuario en sesión
        req.session.usuario = req.user;
        
        req.session.save((err) => {
            if (err) {
                console.error('Error al guardar sesión:', err);
                return res.redirect('/login.html');
            }
            console.log('Sesión guardada, redirigiendo a index');
            res.redirect('/index.html');
        });
    }
);




module.exports = router;