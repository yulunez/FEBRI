exports.obtenerProductoPorId = (req, res) => {
    const db = req.db;
    const { id } = req.params;
    db.query("SELECT * FROM productos WHERE id = ?", [id], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Error en la base de datos" });
        }
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: "Producto no encontrado" });
        }
        res.json({ success: true, producto: results[0] });
    });
};