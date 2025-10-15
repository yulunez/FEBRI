exports.obtenerProductoPorId = (req, res) => {
    const db = req.db;
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ success: false, message: 'ID de producto requerido' });
    }

    db.query('SELECT * FROM producto WHERE ID_producto = ?', [id], (err, results) => {
        if (err) {
            console.error('Error en consulta obtenerProductoPorId:', err);
            return res.status(500).json({ success: false, message: 'Error en la base de datos' });
        }
        if (!results || results.length === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }
        const r = results[0];
        // Normalizar nombres de campos para el frontend
        const producto = {
            id: r.ID_producto,
            ID_producto: r.ID_producto,
            Nombre: r.Nombre || r.nombre || '',
            nombre: r.Nombre || r.nombre || '',
            Precio: r.Precio,
            Imagen: r.imagen || r.Imagen || '',
            Descripcion: r.Descripcion || r.descripcion || r.detalle || '',
            precio_anterior: r.precio_anterior || r.PrecioAnterior || null,
            // incluir el resto de campos por si el frontend los necesita
            raw: r
        };

        res.json({ success: true, producto });
    });
};

// Devuelve los primeros 10 (o menos) productos para la vista principal
exports.obtenerPrimerosDiez = (req, res) => {
    const db = req.db;

    // Seleccionamos columnas existentes en la tabla y ordenamos por la PK correcta
    const sql = 'SELECT ID_producto, Nombre, Precio, imagen FROM producto ORDER BY ID_producto DESC LIMIT 10';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error en consulta obtenerPrimerosDiez:', err);
            return res.status(500).json({ success: false, message: 'Error en la base de datos' });
        }

        // Mapear resultados al formato que el frontend espera
        const productos = Array.isArray(results) ? results.map(r => ({
            id: r.ID_producto,
            Nombre: r.Nombre,
            Precio: r.Precio,
            Imagen: r.imagen // frontend usa 'Imagen'
        })) : [];

        res.json({ success: true, productos });
    });
};

