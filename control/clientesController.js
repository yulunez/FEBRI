exports.mostrarClientes = (req, res) => {
    const db = req.db;
    // Use LEFT JOIN to ensure account rows are returned even if there's no matching cliente
    // Normalize column name casing to match typical schemas (ID_cliente)
    const sql = `SELECT
                acc.ID_cliente AS id_cliente,
                acc.Nombre AS nombre,
                acc.Apellido AS apellido,
                acc.Correo AS correo,
                acc.Telefono AS telefono,
                acc.Direccion AS direccion,
                acc.Fecha_de_nacimiento AS fecha_nacimiento,
                acc.Activo AS Activo,
                acc.Estado AS Estado,
                c.ID_cliente AS cliente_id
                FROM account acc
                LEFT JOIN cliente c ON acc.ID_cliente = c.ID_cliente
                WHERE acc.ID_cliente IS NOT NULL`;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error en consulta mostrarClientes:', err);
            return res.status(500).json({ success: false, message: 'Error en la base de datos' });
        }

        const clientes = Array.isArray(results) ? results.map(r => ({
            id_cliente: r.id_cliente,
            nombre_completo: ((r.nombre || '') + ' ' + (r.apellido || '')).trim(),
            correo: r.correo || null,
            telefono: r.telefono || null,
            direccion: r.direccion || null,
            fecha_nacimiento: r.fecha_nacimiento || null,
            // expose account active flag (0/1) and textual estado if present
            activo: (typeof r.Activo !== 'undefined' && r.Activo !== null) ? (Number(r.Activo) ? 1 : 0) : null,
            estado: r.Estado || null,
            cliente_id: r.cliente_id || null
        })) : [];

        res.json({ success: true, clientes });
    });
};

exports.mostrarTotalVentasporCliente = (req, res) => {
    const db = req.db;
    // Compute both count of ventas and sum of their cost (from detalleventas*producto.precio)
    const sql = `SELECT
                c.ID_cliente AS id_cliente,
                acc.Nombre AS nombre,
                acc.Apellido AS apellido,
                COUNT(DISTINCT v.ID_venta) AS total_ventas,
                COALESCE(SUM(d.Cantidad * p.Precio), 0) AS total_costo
                FROM cliente c
                JOIN account acc ON c.ID_cliente = acc.ID_cliente
                LEFT JOIN venta v ON c.ID_cliente = v.ID_cliente
                LEFT JOIN detalleventas d ON v.ID_venta = d.VentaID
                LEFT JOIN producto p ON d.ProductoID = p.ID_producto
                GROUP BY c.ID_cliente, acc.Nombre, acc.Apellido`;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error en consulta mostrarTotalVentasporCliente:', err);
            return res.status(500).json({ success: false, message: 'Error en la base de datos' });
        }

        const totales = Array.isArray(results) ? results.map(r => ({
            id_cliente: r.id_cliente,
            nombre_completo: ((r.nombre || '') + ' ' + (r.apellido || '')).trim(),
            total_ventas: Number(r.total_ventas || 0),
            total_costo: Number(r.total_costo || 0)
        })) : [];

        res.json({ success: true, totales });
    });
};

// Mostrar ventas (detalle) por cliente
exports.mostrarVentasPorCliente = (req, res) => {
    const db = req.db;
    const id = req.params.id;
    if (!id) return res.status(400).json({ success: false, message: 'ID cliente requerido' });

    const sql = `SELECT 
                d.DetalleID AS id_detalle,
                d.VentaID AS venta,
                d.Cantidad,
                d.Fecha_venta,
                d.ProductoID AS id_producto,
                p.Nombre AS producto,
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
                LEFT JOIN account acc ON acc.ID_cliente = c.ID_cliente
                WHERE c.ID_cliente = ?`;

    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error en consulta mostrarVentasPorCliente:', err);
            return res.status(500).json({ success: false, message: 'Error en la base de datos' });
        }
        const ventas = Array.isArray(results) ? results.map(r => ({
            id_detalle: r.id_detalle,
            venta: r.venta,
            cantidad: Number(r.Cantidad || r.cantidad || 0),
            fecha_venta: r.Fecha_venta || r.fecha_venta || null,
            id_producto: r.id_producto,
            producto: r.producto,
            venta_estado: r.venta_estado || null,
            cliente_correo: r.cliente_correo || null,
            cliente_telefono: r.cliente_telefono || null,
            cliente_direccion: r.cliente_direccion || null,
            precio_und: Number(r.precio_und || r.Precio || r.precio || 0),
            subtotal: Number(r.Subtotal || r.subtotal || 0)
        })) : [];

        res.json({ success: true, ventas });
    });
};

// Toggle 'Activo' (o 'Estado') on the account linked to a cliente
exports.toggleClienteActivo = (req, res) => {
    const db = req.db;
    const id = req.params.id;
    if (!id) return res.status(400).json({ success: false, message: 'ID cliente requerido' });

    // First, get an account row that references this cliente to know available columns
    const sel = 'SELECT ID_login, Activo, Estado FROM account WHERE ID_cliente = ? LIMIT 1';
    db.query(sel, [id], (err, rows) => {
        if (err) {
            console.error('Error comprobando account para toggle:', err);
            return res.status(500).json({ success: false, message: 'Error en la base de datos' });
        }
        if (!rows || rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Account no encontrada para este cliente' });
        }
        const acct = rows[0];
        const accountId = acct.ID_login;

        // Prefer boolean Activo if present
        if (Object.prototype.hasOwnProperty.call(acct, 'Activo')) {
            const nuevo = acct.Activo ? 0 : 1;
            const upd = 'UPDATE account SET Activo = ? WHERE ID_login = ?';
            return db.query(upd, [nuevo, accountId], (err2, result) => {
                if (err2) {
                    console.error('Error actualizando Activo:', err2);
                    return res.status(500).json({ success: false, message: 'Error actualizando cuenta' });
                }
                return res.json({ success: true, accountId, Activo: nuevo });
            });
        }

        // Fallback: toggle Estado string between 'Activo' and 'Suspendido' if column exists
        if (Object.prototype.hasOwnProperty.call(acct, 'Estado')) {
            const cur = (acct.Estado || '').toString().toLowerCase();
            const nuevoEstado = cur.includes('sus') || cur === 'suspendido' ? 'Activo' : 'Suspendido';
            const upd = 'UPDATE account SET Estado = ? WHERE ID_login = ?';
            return db.query(upd, [nuevoEstado, accountId], (err3, result) => {
                if (err3) {
                    console.error('Error actualizando Estado:', err3);
                    return res.status(500).json({ success: false, message: 'Error actualizando cuenta' });
                }
                return res.json({ success: true, accountId, Estado: nuevoEstado });
            });
        }

        // If neither column exists, inform the caller (safe fail)
        return res.status(400).json({ success: false, message: 'No se pudo alternar: la tabla account no tiene columnas Activo ni Estado' });
    });
};