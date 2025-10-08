exports.obtenerProductoPorId = (req, res) => {
    const db = req.db;
    //const { id } = req.params;
    id = 1
    db.query("SELECT * FROM producto WHERE id = ?", [id], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Error en la base de datos" });
        }
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: "Producto no encontrado" });
        }
        res.json({ success: true, producto: results[0] });
    });
};

