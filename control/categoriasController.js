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

// Inserta una nueva categoría en la base de datos.
// Espera JSON: { nombre: string, imagen: string }
exports.insertarCategoria = (req, res) => {
    const db = req.db;
    const nombre = (req.body.nombre || req.body.Nombre || '').trim();
    const imagen = req.body.imagen || req.body.Imagen || null;

    if (!nombre) {
        return res.status(400).json({ success: false, message: 'Nombre de categoría requerido' });
    }

    const sql = 'INSERT INTO categoria (Nombre, imagen) VALUES (?, ?)';
    db.query(sql, [nombre, imagen], (err, result) => {
        if (err) {
            console.error('Error en consulta insertarCategoria:', err);
            return res.status(500).json({ success: false, message: 'Error en la base de datos', error: err.message });
        }
        const id = result.insertId;
        return res.json({ success: true, message: 'Categoría creada', categoria: { id, nombre, Imagen: imagen } });
    });
};