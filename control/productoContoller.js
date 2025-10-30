const e = require("express");

exports.obtenerProductoPorId = (req, res) => {
    console.log(`productoContoller.obtenerProductoPorId called - url=${req.originalUrl} params=${JSON.stringify(req.params)}`);
    const db = req.db;
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ success: false, message: 'ID de producto requerido' });
    }

    // Note: producto_inventario table is not present in this schema. Use p.Stock directly.
    const sql = `SELECT p.*, c.ID_categoria AS ID_categoria, c.Nombre AS categoriaNombre, COALESCE(p.Stock,0) AS Stock
    FROM producto p
    LEFT JOIN categoria c ON p.ID_categoria = c.ID_categoria
    WHERE p.ID_producto = ?`;

    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error en consulta obtenerProductoPorId:', err);
            // Dev response includes error.message to help debug during development
            return res.status(500).json({ success: false, message: 'Error en la base de datos', error: err.message });
        }
        if (!results || results.length === 0) {
            console.warn(`obtenerProductoPorId: producto no encontrado id=${id}`);
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


            ID_categoria: r.ID_categoria || null,
            categoriaNombre: r.categoriaNombre || null,
            Stock: r.Stock != null ? r.Stock : null,
            // incluir el resto de campos por si el frontend los necesita
            raw: r
        };

        console.log(`obtenerProductoPorId: encontrado producto id=${id}`);
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

exports.productosParaAdmin = (req, res) => {
    const db = req.db;
    const sql = `SELECT
        p.ID_producto AS ID_producto,
        p.Nombre AS productoNombre,
        p.Precio AS Precio,
        p.imagen AS imagen,
        p.Descripcion AS Descripcion,
        p.Estado AS Estado,
        p.Stock AS Stock,
        c.ID_categoria AS ID_categoria,
        c.Nombre AS categoriaNombre
    FROM producto p
    LEFT JOIN categoria c ON p.ID_categoria = c.ID_categoria
    ORDER BY p.ID_producto DESC`;
    db.query(sql, (err, results) => {
        if (err) {
            // Log detallado para depuración
            console.error('Error en consulta productosParaAdmin:', err);
            // Mostrar datos adicionales (código y SQL) si existen
            if (err.code || err.sql) {
                console.error('SQL error code:', err.code, 'SQL:', err.sql);
            }
            // Respuesta temporal con el mensaje de error para depuración frontend
            return res.status(500).json({ success: false, message: 'Error en la base de datos', error: err.message });
        }
        const productos = Array.isArray(results) ? results.map(r => ({
            id: r.ID_producto,
            Nombre: r.productoNombre || r.Nombre || r.nombre,
            Precio: r.Precio,
            Imagen: r.imagen,
            Descripcion: r.Descripcion,
            Estado: r.Estado,
            Categoria: r.categoriaNombre || '-',
            ID_categoria: r.ID_categoria || null,
            Stock: r.Stock
        })) : [];
        res.json({ success: true, productos });
    });
};

exports.definirEstadoProducto = (stock) => {
    const s = Number(stock) || 0;
    if (s > 10) return 'En Stock';
    if (s > 0) return 'Bajo Stock';
    return 'Agotado';
};
exports.insertarProducto = (req, res) => {
    const db = req.db;
    // Normalize incoming fields (accept different casings/names)
    const Nombre = req.body.Nombre || req.body.nombre || '';
    const imagen = req.body.imagen || req.body.Imagen || null;
    // Determinar Estado en servidor (defensa): usar la función exportada
    const Estado = exports.definirEstadoProducto(req.body.Stock || req.body.stock || 0);
    const Descripcion = req.body.Descripcion || req.body.descripcion || '';
    const Precio = (req.body.Precio != null) ? req.body.Precio : (req.body.precio != null ? req.body.precio : 0);
    const ID_categoria = req.body.ID_categoria || req.body.categoria || req.body.Categoria || req.body.categoriaId || null;
    const Stock = (req.body.Stock != null) ? req.body.Stock : (req.body.stock != null ? req.body.stock : null);

    // Only store product metadata in 'producto'. Inventory is stored in 'producto_inventario'.
    const sql = `INSERT INTO producto (Nombre, imagen, Estado, Descripcion, Precio, Stock, ID_categoria)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.query(sql, [Nombre, imagen, Estado, Descripcion, Precio, Stock, ID_categoria], (err, result) => {
        if (err) {
            console.error('Error en consulta insertarProducto:', err);
            return res.status(500).json({ success: false, message: 'Error en la base de datos', code: err.code, sqlMessage: err.sqlMessage });
        }
        const productoId = result.insertId;
        // Inventory table is not used in this deployment - ignore any provided Stock value
        if (Stock != null) {
            console.warn('Stock provided but producto_inventario is not used; ignoring Stock for productoId', productoId);
            return res.json({ success: true, message: 'Producto insertado correctamente (stock ignorado)', productoId });
        }
        return res.json({ success: true, message: 'Producto insertado correctamente', productoId });
    });
};

exports.actualizarProducto = (req, res) => {   
    const db = req.db;
    const { id } = req.params;
    console.log(`productoContoller.actualizarProducto called - id=${id} body=${JSON.stringify(req.body)}`);
    // Normalize incoming fields
    const Nombre = req.body.Nombre || req.body.nombre || '';
    const imagen = req.body.imagen || req.body.Imagen || null;
    // Determinar Estado en servidor (defensa): usar la función exportada
    const Estado = exports.definirEstadoProducto(req.body.Stock || req.body.stock || 0);
    const Descripcion = req.body.Descripcion || req.body.descripcion || '';
    const Precio = (req.body.Precio != null) ? req.body.Precio : (req.body.precio != null ? req.body.precio : 0);
    const ID_categoria = req.body.ID_categoria || req.body.categoria || req.body.Categoria || req.body.categoriaId || null;
    const Stock = (req.body.Stock != null) ? req.body.Stock : (req.body.stock != null ? req.body.stock : null);

    // Update only product metadata in 'producto'; inventory stored in producto_inventario
    const sql = `UPDATE producto
                 SET Nombre = ?, imagen = ?, Estado = ?, Descripcion = ?, Precio = ?, Stock = ?, ID_categoria = ?
                 WHERE ID_producto = ?`;
    db.query(sql, [Nombre, imagen, Estado, Descripcion, Precio, Stock, ID_categoria, id], (err, result) => {
        if (err) {
            console.error('Error en consulta actualizarProducto:', err);
            return res.status(500).json({ success: false, message: 'Error en la base de datos', error: err.message });
        }
        const productoId = id;
        // Inventory is not managed here. If Stock is provided, log a notice but still return success.
        if (Stock != null) {
            console.warn('Stock provided on update but producto_inventario is not used; ignoring separate inventory table for productoId', productoId);
        }
        return res.json({ success: true, message: 'Producto actualizado correctamente', productoId, affectedRows: result.affectedRows });
    });
};

// Favoritos: simple session-backed list of product IDs
exports.obtenerFavoritos = (req, res) => {
    const db = req.db;
    // Ensure session exists (express-session middleware configured in server.js)
    const rawFavs = (req.session && Array.isArray(req.session.favoritos)) ? req.session.favoritos : [];
    // If stored as IDs (legacy), resolve them to product objects
    const needResolveIds = rawFavs.length > 0 && typeof rawFavs[0] !== 'object';
    if (!needResolveIds) {
        return res.json({ success: true, favoritos: rawFavs });
    }
    // resolve IDs -> fetch products
    const ids = rawFavs.map(String);
    const sql = `SELECT ID_producto AS id, Nombre, imagen, Precio FROM producto WHERE ID_producto IN (${ids.map(() => '?').join(',')})`;
    db.query(sql, ids, (err, results) => {
        if (err) {
            console.error('Error al resolver favoritos:', err);
            return res.status(500).json({ success: false, message: 'Error en la base de datos', error: err.message });
        }
        // Map results preserving original order
        const mapById = new Map(results.map(r => [String(r.id), r]));
        const favoritos = ids.map(i => mapById.get(i)).filter(Boolean);
        // replace session favorites with resolved objects for future speed
        req.session.favoritos = favoritos;
        return res.json({ success: true, favoritos });
    });
};

exports.agregarFavorito = (req, res) => {
    if (!req.session) return res.status(500).json({ success: false, message: 'Sesión no disponible' });
    const id = req.body.id || req.body.ID_producto || req.body.productoId;
    if (!id) return res.status(400).json({ success: false, message: 'ID de producto requerido' });
    const db = req.db;
    const sql = 'SELECT ID_producto AS id, Nombre, imagen, Precio FROM producto WHERE ID_producto = ? LIMIT 1';
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error al obtener producto para favorito:', err);
            return res.status(500).json({ success: false, message: 'Error en la base de datos', error: err.message });
        }
        if (!results || results.length === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }
        const prod = results[0];
        req.session.favoritos = req.session.favoritos || [];
        // avoid duplicates by id
        if (!req.session.favoritos.find(f => String(f.id) === String(prod.id))) {
            req.session.favoritos.push(prod);
        }
        req.session.save?.(() => {});
        return res.json({ success: true, favoritos: req.session.favoritos });
    });
};

exports.quitarFavorito = (req, res) => {
    if (!req.session) return res.status(500).json({ success: false, message: 'Sesión no disponible' });
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: 'ID de producto requerido' });
    req.session.favoritos = req.session.favoritos || [];
    req.session.favoritos = req.session.favoritos.filter(f => String(f.id || f) !== String(id));
    req.session.save?.(() => {});
    res.json({ success: true, favoritos: req.session.favoritos });
};

exports.totalProductos = (req, res) => {
    const db = req.db;
    const sql = 'SELECT COUNT(*) AS total FROM producto';   
    db.query(sql, (err, results) => {
        if (err) {  
            console.error('Error en consulta totalProductos:', err);
            return res.status(500).json({ success: false, message: 'Error en la base de datos' });
        }
        const total = (Array.isArray(results) && results.length > 0) ? Number(results[0].total || 0) : 0;
        res.json({ success: true, total });
    });
};

