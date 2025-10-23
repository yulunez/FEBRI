exports.mostrarCategorias = (req, res) => {
    const db = req.db;
    db.query('SELECT ID_categoria, Nombre, imagen FROM categoria', (err, results) => {
        if (err) {
            console.error('Error en consulta mostrarCategorias:', err);
            return res.status(500).json({ success: false, message: 'Error en la base de datos' });
        }

        const categorias = Array.isArray(results) ? results.map(r => ({
            id: r.ID_categoria,
            nombre: r.Nombre || r.nombre || '',
            Imagen: r.Imagen || r.imagen || ''
        })) : [];

        res.json({ success: true, categorias });
    });
};