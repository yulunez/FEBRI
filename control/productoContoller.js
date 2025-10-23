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
        const producto = {
            id: r.ID_producto,
            ID_producto: r.ID_producto,
            Nombre: r.Nombre || r.nombre || '',
            nombre: r.Nombre || r.nombre || '',
            Precio: r.Precio,
            Imagen: r.imagen || r.Imagen || '',
            Descripcion: r.Descripcion || r.descripcion || r.detalle || '',
            precio_anterior: r.precio_anterior || r.PrecioAnterior || null,
            raw: r
        };

        res.json({ success: true, producto });
    });
};

exports.obtenerPrimerosDiez = (req, res) => {
    const db = req.db;

    const sql = 'SELECT ID_producto, Nombre, Precio, imagen FROM producto ORDER BY ID_producto DESC LIMIT 10';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error en consulta obtenerPrimerosDiez:', err);
            return res.status(500).json({ success: false, message: 'Error en la base de datos' });
        }

        const productos = Array.isArray(results) ? results.map(r => ({
            id: r.ID_producto,
            Nombre: r.Nombre,
            Precio: r.Precio,
            Imagen: r.imagen
        })) : [];

        res.json({ success: true, productos });
    });
};

exports.obtenerProductosPorCategoria = (req, res) => {
    const db = req.db;
    const { categoriaId } = req.params;
    const sql = 'SELECT ID_producto, Nombre, Precio, imagen FROM producto WHERE ID_categoria = ?';
    db.query(sql, [categoriaId], (err, results) => {
        if (err) {
            console.error('Error en consulta obtenerProductosPorCategoria:', err);
            return res.status(500).json({ success: false, message: 'Error en la base de datos' });
        }
        const productos = Array.isArray(results) ? results.map(r => ({
            id: r.ID_producto,
            Nombre: r.Nombre,
            Precio: r.Precio,
            Imagen: r.imagen
        })) : [];
        res.json({ success: true, productos });
    });
};

exports.buscarProductos = (req, res) => {
    const db = req.db;
    const { termino } = req.query;

    console.log(' BÚSQUEDA RECIBIDA:', termino);

    if (!termino || termino.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'Se requiere un término de búsqueda',
            productos: []
        });
    }

    const limpio = termino.trim().toLowerCase();
    const palabras = limpio.split(/\s+/).filter(Boolean);
    
    console.log(' Palabras:', palabras);
    
    const variantes = new Set();
    variantes.add(limpio);
    
    palabras.forEach(palabra => {
        variantes.add(palabra);
        
        if (palabra.endsWith('es') && palabra.length > 3) {
            variantes.add(palabra.slice(0, -2));
        }
        if (palabra.endsWith('s') && palabra.length > 2) {
            variantes.add(palabra.slice(0, -1));
        }
        
        if (!palabra.endsWith('s')) {
            variantes.add(palabra + 's');
            variantes.add(palabra + 'es');
        }
    });
    
    const variantesArray = Array.from(variantes);
    console.log(' Variantes:', variantesArray);
    
    const condiciones = variantesArray.map(() => 
        '(LOWER(Nombre) LIKE ? OR LOWER(Descripcion) LIKE ?)'
    );
    
    const params = [];
    variantesArray.forEach(v => {
        params.push(`%${v}%`, `%${v}%`);
    });
    
    const sql = `SELECT DISTINCT ID_producto, Nombre, Precio, imagen, Descripcion FROM producto WHERE ${condiciones.join(' OR ')} LIMIT 100`;

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('ERROR:', err.message);
            return res.status(500).json({
                success: false,
                message: 'Error en la base de datos',
                productos: []
            });
        }

        console.log(` Encontrados: ${results.length}`);

        const productos = Array.isArray(results) ? results.map(r => ({
            id: r.ID_producto,
            Nombre: r.Nombre || '',
            Precio: parseFloat(r.Precio) || 0,
            Imagen: r.imagen || '',
            Descripcion: r.Descripcion || ''
        })) : [];

        res.json({
            success: true,
            productos: productos,
            total: productos.length
        });
    });
};