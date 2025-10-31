const envioController = require('./envioController');

// Ahora del carrito sacamos la cantidad de cada producto y cuando se haga la compra se actualice el stock

exports.realizarCompra = (req, res) => {
    const carro = req.session.carro || {};
    const usuarioId = req.session.usuarioId
        || (req.session.usuario && (
            req.session.usuario.id
            || req.session.usuario.IdCliente
            || req.session.usuario.ID_cliente
            || req.session.usuario.ID_Cliente
            || req.session.usuario.ID
            || null
        ))
        || null;
    const bodyUsuarioId = req.body && (req.body.usuarioId || req.body.ID || req.body.id);
    if (!usuarioId && bodyUsuarioId) {
        return req.db.query('SELECT ID_cliente FROM account WHERE ID_cliente = ? LIMIT 1', [bodyUsuarioId], (err, rows) => {
            if (err) {
                console.error('Error validando usuarioId del body:', err);
                return res.status(500).json({ success: false, mensaje: 'Error interno' });
            }
            if (rows && rows.length > 0) {
                try { req.session.usuarioId = rows[0].ID; } catch (e) { /* ignore */ }
                console.log('Compras: usando usuarioId proporcionado en body ->', rows[0].ID);
                return startPurchase(rows[0].ID);
            }
            return res.status(401).json({ success: false, mensaje: 'Usuario no encontrado' });
        });
    }
    const totalCompra = req.body.total; // El total de la compra enviado desde el cliente
    const startPurchase = (finalUsuarioId) => {
        if (!finalUsuarioId) {
            console.warn('realizarCompra: usuario no identificado en sesión, abortando');
            return res.status(401).json({ success: false, mensaje: 'No autorizado: inicie sesión antes de comprar' });
        }
        const db = req.db;

        // Start a DB transaction to ensure atomicity
        db.beginTransaction(err => {
            console.log('DB beginTransaction callback, err=', err);
            if (err) {
                console.error('Error iniciando transacción:', err);
                return res.status(500).json({ success: false, mensaje: 'No se pudo iniciar la transacción' });
            }

            const estado = 'pendiente';
            const sqlInsertVenta = 'INSERT INTO venta (ID_cliente, Estado, total) VALUES (?, ?, ?)';
            db.query(sqlInsertVenta, [finalUsuarioId || null, estado, totalCompra || 0], (err, result) => {
                console.log('Insert venta result err=', err, 'result=', result && { insertId: result.insertId, affectedRows: result.affectedRows });
                if (err) {
                    console.error('Error insertando venta:', err);
                    return db.rollback(() => res.status(500).json({ success: false, mensaje: 'Error creando la venta', error: err.message }));
                }

                const ventaId = result && result.insertId;
                console.log('Venta inserted with id=', ventaId);

                // Generar el envío usando la función existente en envioController
                // Obtener datos del usuario de la sesión
                const usuario = req.session.usuario || {};
                const envioData = {
                    direccion: usuario.direccion || '',
                    costo: totalCompra || 0, // El costo del envío será el total de la venta
                    nombre: `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim(),
                    clienteId: finalUsuarioId,
                    ventaId: ventaId
                };

                envioController.generarEnvioInterno(db, envioData)
                    .then(envioId => {

                        const productoIds = Object.keys(carro || {});
                        console.log('Productos en carro:', productoIds);

                // process each product sequentially to preserve order and allow early rollback on failure
                        const processNext = (index) => {
                            if (index >= productoIds.length) {
                                // all items processed, commit
                                return db.commit(commitErr => {
                                    console.log('Commit callback, err=', commitErr);
                                    if (commitErr) {
                                        console.error('Error al hacer commit:', commitErr);
                                        return db.rollback(() => res.status(500).json({ success: false, mensaje: 'Error finalizando la compra', error: commitErr.message }));
                                    }
                                    // clear server-side cart
                                    try { req.session.carro = {}; } catch (e) { /* ignore */ }
                                    return res.json({ success: true, mensaje: 'Compra procesada correctamente', ventaId });
                                });
                            }

                            const pid = productoIds[index];
                            const cantidad = Number(carro[pid]) || 0;
                            // coerce product id to number to avoid type-mismatch in SQL comparisons
                            const pidInt = Number(pid);
                            console.log('Processing product:', { pid, pidType: typeof pid, pidInt, cantidad });

                            // 1) decrement stock only if sufficient
                            const sqlUpdateStock = 'UPDATE producto SET Stock = Stock - ? WHERE ID_producto = ? AND Stock >= ?';
                            db.query(sqlUpdateStock, [cantidad, pidInt, cantidad], (err, updRes) => {
                                console.log('Update stock result for pidInt=', pidInt, 'err=', err, 'updRes=', updRes && { affectedRows: updRes.affectedRows });
                                if (err) {
                                    console.error('Error actualizando stock para producto', pid, err);
                                    return db.rollback(() => res.status(500).json({ success: false, mensaje: 'Error actualizando stock', error: err.message }));
                                }
                                if (!updRes || updRes.affectedRows === 0) {
                                    // stock insuficiente
                                    const msg = `Stock insuficiente para el producto ${pid}`;
                                    console.warn(msg);
                                    return db.rollback(() => res.status(400).json({ success: false, mensaje: msg }));
                                }

                                // 2) obtener precio unitario del producto para calcular subtotal, e insertar detalleventas
                                const sqlSelectPrecio = 'SELECT Precio, precio FROM producto WHERE ID_producto = ? LIMIT 1';
                                db.query(sqlSelectPrecio, [pidInt], (priceErr, priceRows) => {
                                    if (priceErr) {
                                        console.error('Error obteniendo precio para producto', pidInt, priceErr);
                                        return db.rollback(() => res.status(500).json({ success: false, mensaje: 'Error obteniendo precio del producto', error: priceErr.message }));
                                    }
                                    if (!priceRows || priceRows.length === 0) {
                                        console.error('No se encontró producto para precio, id=', pidInt);
                                        return db.rollback(() => res.status(500).json({ success: false, mensaje: 'Producto no encontrado al obtener precio' }));
                                    }
                                    const row = priceRows[0];
                                    const precioUnitario = Number(row.Precio || row.precio || 0);
                                    const subtotal = precioUnitario * cantidad;
                                    const sqlInsertDetalle = 'INSERT INTO detalleventas (VentaID, ProductoID, Cantidad, Fecha_venta, Subtotal) VALUES (?, ?, ?, NOW(), ?)';
                                    db.query(sqlInsertDetalle, [ventaId, pidInt, cantidad, subtotal], (err2, detalleRes) => {
                                        console.log('Insert detalle result for pidInt=', pidInt, 'cantidad=', cantidad, 'subtotal=', subtotal, 'err2=', err2, 'detalleRes=', detalleRes && { insertId: detalleRes.insertId });
                                        if (err2) {
                                            console.error('Error insertando detalle de venta para producto', pid, err2);
                                            return db.rollback(() => res.status(500).json({ success: false, mensaje: 'Error guardando detalle de la venta', error: err2.message }));
                                        }
                                        // proceed to next item
                                        processNext(index + 1);
                                    });
                                });
                            });
                        };

                                // start processing items
                        processNext(0);
                    })
                    .catch(err => {
                        console.error('Error generando envío:', err);
                        return db.rollback(() => res.status(500).json({ success: false, mensaje: 'Error generando envío', error: err.message }));
                    });
            });
        });
    };

    // If usuarioId not present, try to infer from session.usuario.email (correo) by querying DB
    if (!usuarioId) {
        const possibleEmail = req.session && req.session.usuario && req.session.usuario.correo;
        if (possibleEmail) {
            // lookup user id by email
            req.db.query('SELECT ID FROM account WHERE Correo = ? LIMIT 1', [possibleEmail], (err, rows) => {
                if (err) {
                    console.error('Error buscando ID de usuario por correo:', err);
                    return res.status(500).json({ success: false, mensaje: 'Error interno' });
                }
                if (rows && rows.length > 0) {
                    const foundId = rows[0].ID;
                    console.log('Inferred usuarioId from session.correo ->', foundId);
                    return startPurchase(foundId);
                }
                console.warn('No se pudo inferir usuarioId desde session.correo:', possibleEmail);
                return res.status(401).json({ success: false, mensaje: 'No autorizado: inicie sesión antes de comprar' });
            });
            return;
        }
        // no email to look up
        console.warn('realizarCompra: usuario no identificado en sesión (sin usuarioId ni correo), abortando');
        return res.status(401).json({ success: false, mensaje: 'No autorizado: inicie sesión antes de comprar' });
    }
    // If we already have usuarioId, proceed
    startPurchase(usuarioId);
};

exports.obtenerComprasUsuario = (req, res) => {
    const usuarioId = req.session.usuarioId
        || (req.session.usuario && (
            req.session.usuario.id
            || req.session.usuario.IdCliente
            || req.session.usuario.ID_cliente
            || req.session.usuario.ID_Cliente
            || req.session.usuario.ID
            || null 
        ))
        || null;
    if (!usuarioId) {
        return res.status(401).json({ success: false, mensaje: 'No autorizado: inicie sesión para ver sus compras' });
    }
    // Seleccionamos cantidad en detalle para poder mostrar la cantidad en el frontend
    const sql = `SELECT 
                v.ID_venta AS ID_venta, 
                v.ID_cliente AS ID_cliente,
                v.total AS total, 
                dv.Fecha_venta AS Fecha_venta, 
                dv.ProductoID AS ProductoID,
                dv.Cantidad AS Cantidad,
                p.Nombre AS Nombre_producto,
                p.Imagen AS Imagen_producto
                FROM venta v
                JOIN detalleventas dv ON v.ID_venta = dv.VentaID
                JOIN producto p ON dv.ProductoID = p.ID_producto
                WHERE v.ID_cliente = ?
                ORDER BY dv.Fecha_venta DESC, v.ID_venta DESC`;

    req.db.query(sql, [usuarioId], (err, rows) => {
        if (err) {
            console.error('Error obteniendo compras del usuario:', err);
            return res.status(500).json({ success: false, mensaje: 'Error obteniendo compras' });
        }

        // Agrupar filas por ID_venta para construir el formato que espera el front
        // Cada compra: { id, fecha, total, productos: [{ id, nombre, imagen, cantidad }] }
        const comprasMap = new Map();

        (Array.isArray(rows) ? rows : []).forEach(r => {
            const ventaId = r.ID_venta;
            if (!comprasMap.has(ventaId)) {
                comprasMap.set(ventaId, {
                    id: ventaId,
                    fecha: r.Fecha_venta,
                    total: Number(r.total || 0),
                    productos: []
                });
            }
            const compra = comprasMap.get(ventaId);

            // Añadir producto al arreglo de la compra
            compra.productos.push({
                id: r.ProductoID,
                nombre: r.Nombre_producto || r.nombre || '',
                imagen: r.Imagen_producto || r.Imagen || '',
                cantidad: Number(r.Cantidad || 1)
            });
        });

        // Convertir Map a array ordenado por fecha (desc)
        const compras = Array.from(comprasMap.values()).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        return res.json({ success: true, compras });
    });
};