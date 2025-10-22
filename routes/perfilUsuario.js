const express = require("express");
const router = express.Router();

// Ruta GET para obtener información del perfil
router.get("/", (req, res) => {
    console.log('=== OBTENIENDO PERFIL ===');
    console.log('Session ID:', req.sessionID);
    console.log('Usuario en sesión:', req.session?.usuario);
    
    if (!req.session || !req.session.usuario) {
        console.log('❌ NO HAY SESIÓN ACTIVA');
        return res.json({ success: false, message: 'No hay sesión activa' });
    }

    console.log('✓ Enviando datos del usuario');
    console.log('=== FIN OBTENER PERFIL ===');
    
    return res.json({ 
        success: true, 
        usuario: req.session.usuario 
    });
});

module.exports = router;