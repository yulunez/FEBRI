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

// ✅ FUNCIÓN CORREGIDA CON LOGS DE DEBUG
exports.buscarProductos = (req, res) => {
    const db = req.db;
    const { termino } = req.query;
    
    console.log('🔍 BÚSQUEDA INICIADA');
    console.log('📝 Término recibido:', termino);
    console.log('📝 Tipo de término:', typeof termino);
    
    if (!termino || termino.trim() === '') {
        console.log('⚠️ Término vacío o inválido');
        return res.status(400).json({ 
            success: false, 
            message: 'Se requiere un término de búsqueda',
            productos: []
        });
    }
    
    const parametro = `%${termino.trim()}%`;
    console.log('🔎 Parámetro SQL:', parametro);
    
    const sql = `SELECT ID_producto, Nombre, Precio, imagen, Descripcion 
                 FROM producto 
                 WHERE Nombre LIKE ? OR Descripcion LIKE ?`;
    
    console.log('💾 Ejecutando consulta SQL...');
    
    db.query(sql, [parametro, parametro], (err, results) => {
        if (err) {
            console.error('❌ Error en consulta:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Error en la base de datos',
                productos: []
            });
        }
        
        console.log('✅ Consulta ejecutada');
        console.log('📊 Resultados brutos:', results);
        console.log('📊 Total de resultados:', results ? results.length : 0);
        
        const productos = Array.isArray(results) ? results.map(r => {
            console.log('📦 Procesando producto:', r.Nombre);
            return {
                id: r.ID_producto,
                Nombre: r.Nombre || '',
                Precio: parseFloat(r.Precio) || 0,
                Imagen: r.imagen || '',
                Descripcion: r.Descripcion || ''
            };
        }) : [];
        
        console.log('✅ Productos procesados:', productos.length);
        console.log('📤 Enviando respuesta...');
        
        res.json({ 
            success: true, 
            productos: productos,
            total: productos.length
        });
    });
};