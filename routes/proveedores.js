const express = require('express');
const router = express.Router();

// Ruta para obtener lista de proveedores
router.get('/', (req, res) => {
    const db = req.db;
    db.query('SELECT ID_proveedor, Nombre FROM proveedores ORDER BY Nombre', (err, results) => {
        if (err) {
            console.error('Error al obtener proveedores:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Error al obtener la lista de proveedores' 
            });
        }
        res.json({ success: true, proveedores: results });
    });
});

module.exports = router;