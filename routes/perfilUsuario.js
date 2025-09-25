const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    if (req.session && req.session.usuario) {
        res.json({ success: true, usuario: req.session.usuario });
    } else {
        res.json({ success: false, message: 'No hay sesión activa' });
    }
});

module.exports = router