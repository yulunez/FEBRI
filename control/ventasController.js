// Export corrected function name expected by routes: mostrarVentas
exports.mostrarVentas = (req, res) => {
    const db = req.db;
    const sql = `SELECT 
                    d.DetalleID AS id_detalle,
                    d.VentaID AS venta,
                    d.Cantidad,
                    d.Fecha_venta,
                    d.ProductoID AS id_producto,
                    p.Nombre AS producto,
                    c.Nombre AS cliente,
                    v.Estado AS venta_estado,
                    acc.Correo AS cliente_correo,
                    acc.Telefono AS cliente_telefono,
                    acc.Direccion AS cliente_direccion,
                    p.Precio AS precio_und,
                    (d.Cantidad * p.Precio) AS Subtotal
                FROM detalleventas d
                JOIN producto p ON d.ProductoID = p.ID_producto
                JOIN venta v ON d.VentaID = v.ID_venta
                JOIN cliente c ON v.ID_cliente = c.ID_cliente
                LEFT JOIN account acc ON acc.id_cliente = c.ID_cliente;`;
    db.query(sql, (err, results) => {
        if (err) {
            // Log full error for debugging
            console.error('Error en consulta mostrarVentas:', err);
            // Return helpful info to the client during development
            return res.status(500).json({ success: false, message: 'Error en la base de datos', error: err.message, code: err.code });
        }
        const ventas = Array.isArray(results) ? results.map(r => ({
            id_detalle: r.id_detalle,
            venta: r.venta,
            // normalize numeric fields to JS numbers and provide multiple common keys
            cantidad: Number(r.Cantidad || r.cantidad || 0),
            Cantidad: Number(r.Cantidad || r.cantidad || 0),
            fecha_venta: r.Fecha_venta || r.fecha_venta || null,
            id_producto: r.id_producto,
            producto: r.producto,
            cliente: r.cliente,
            venta_estado: r.venta_estado || r.venda_estado || r.estado || r.Estado || null,
            cliente_correo: r.cliente_correo || r.correo || null,
            cliente_telefono: r.cliente_telefono || r.telefono || null,
            cliente_direccion: r.cliente_direccion || r.direccion || null,
            precio_und: Number(r.precio_und || r.Precio || r.precio || 0),
            Precio: Number(r.precio_und || r.Precio || r.precio || 0),
            subtotal: Number(r.Subtotal || r.subtotal || 0),
            Subtotal: Number(r.Subtotal || r.subtotal || 0)
        })) : [];
        res.json({ success: true, ventas });
    });
};

// Update estado of a venta (order)
exports.actualizarEstadoVenta = (req, res) => {
    const db = req.db;
    const ventaId = req.params.id;
    const nuevoEstado = req.body && (req.body.estado || req.body.Estado);
    if (!ventaId || !nuevoEstado) {
        return res.status(400).json({ success: false, message: 'ID de venta y estado son requeridos' });
    }

    // Iniciar transacción para actualizar tanto la venta como el envío
    db.beginTransaction(err => {
        if (err) {
            console.error('Error iniciando transacción:', err);
            return res.status(500).json({ success: false, message: 'Error iniciando transacción', error: err.message });
        }

        // 1. Actualizar estado de la venta
        const sqlVenta = 'UPDATE venta SET Estado = ? WHERE ID_venta = ?';
        db.query(sqlVenta, [nuevoEstado, ventaId], (err, result) => {
            if (err) {
                return db.rollback(() => {
                    console.error('Error actualizando estado de venta:', err);
                    res.status(500).json({ success: false, message: 'Error actualizando estado', error: err.message });
                });
            }

            // 2. Actualizar el envío correspondiente
            let sqlEnvio;
            let parametros;
            let fechaEnvio;
            let fechaEntrega;

            if (nuevoEstado.toLowerCase() === 'enviado') {
                // Solo si el estado es "Enviado", actualizar fecha_de_envio y calcular fecha_de_entrega
                fechaEnvio = new Date();
                fechaEntrega = new Date(fechaEnvio);
                fechaEntrega.setDate(fechaEntrega.getDate() + 15); // Fecha de entrega a 15 días
                
                sqlEnvio = 'UPDATE envio SET Estado = ?, Fecha_de_envio = ?, Fecha_de_entrega = ? WHERE ID_venta = ?';
                parametros = [nuevoEstado, fechaEnvio, fechaEntrega, ventaId];
            } else {
                // Para otros estados, solo actualizar el estado
                sqlEnvio = 'UPDATE envio SET Estado = ? WHERE ID_venta = ?';
                parametros = [nuevoEstado, ventaId];
            }

            db.query(sqlEnvio, parametros, (err, envioResult) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Error actualizando estado de envío:', err);
                        res.status(500).json({ success: false, message: 'Error actualizando envío', error: err.message });
                    });
                }

                // Commit los cambios si todo salió bien
                db.commit(err => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('Error en commit:', err);
                            res.status(500).json({ success: false, message: 'Error guardando cambios', error: err.message });
                        });
                    }
                    const response = { 
                        success: true, 
                        updated: result.affectedRows,
                        envioUpdated: envioResult.affectedRows
                    };
                    
                    // Solo incluir fechas si el estado es "Enviado"
                    if (nuevoEstado.toLowerCase() === 'enviado') {
                        response.fechaEnvio = fechaEnvio;
                        response.fechaEntrega = fechaEntrega;
                    }
                    
                    res.json(response);
                });
            });
        });
    });
};

exports.ventasDelDia = (req, res) => {
    const db = req.db;
    // Buscamos ventas del día actual y la ganancia total, ademas la comparacion al dia anterior
    const sql = `SELECT
                    COUNT(*) AS total_ventas,
                    SUM(d.Cantidad * p.Precio) AS total_ganancias
                FROM venta v
                JOIN detalleventas d ON v.ID_venta = d.VentaID
                JOIN producto p ON d.ProductoID = p.ID_producto
                WHERE DATE(d.Fecha_venta) = CURDATE();`;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error en consulta ventasDelDia:', err);
            return res.status(500).json({ success: false, message: 'Error en la base de datos' });
        }
        if (Array.isArray(results) && results.length > 0) {
            const r = results[0];
            const ventasDelDia = {  
                total_ventas: Number(r.total_ventas || 0),
                total_ganancias: Number(r.total_ganancias || 0)
            };
            return res.json({ success: true, ventasDelDia });
        } else {
            return res.json({ success: true, ventasDelDia: { total_ventas: 0, total_ganancias: 0 } });
        }   
    });
}   
