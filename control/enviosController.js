exports.obtenerEnviosUsuario = (req, res) => {
    const db = req.db;
    // En sesión suele venir ID_usuario; si usas ID_cliente, también lo intento
    const userId =
        req.session?.usuario?.ID_usuario ??
        req.session?.usuario?.ID_cliente;

    if (!userId) {
        return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    // JOIN detalleventas (dv) y producto (p) correctamente; la imagen está en la tabla producto
    const sql = `
        SELECT 
            e.ID_envio AS ID_envio,
            e.Direccion_de_destino AS Direccion_de_destino,
            e.Fecha_de_envio AS Fecha_de_envio,
            e.Fecha_de_entrega AS Fecha_de_entrega,
            e.Costo AS Costo,
            e.Nombre_destinatario AS Nombre_destinatario,
            e.Estado AS Estado,
            e.ID_venta AS ID_venta,
            dv.ProductoID AS ProductoID,
            dv.Cantidad AS Cantidad,
            p.Nombre AS Producto_nombre,
            p.Imagen AS Producto_imagen
        FROM envio e
        LEFT JOIN venta v ON e.ID_venta = v.ID_venta
        LEFT JOIN detalleventas dv ON v.ID_venta = dv.VentaID
        LEFT JOIN producto p ON dv.ProductoID = p.ID_producto
        WHERE e.ID_cliente = ?
        ORDER BY e.Fecha_de_envio DESC
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Error obtenerEnviosUsuario:', err);
            return res.status(500).json({ success: false, message: 'Error en la base de datos' });
        }

        const estadoMap = {
            1: 'en_proceso',
            2: 'en_transito',
            3: 'entregado',
            4: 'cancelado'
        };

        // Agrupar resultados por envio para incluir múltiples productos por envío
        const enviosMap = new Map();
        (Array.isArray(results) ? results : []).forEach(r => {
            const envioId = r.ID_envio;
            if (!enviosMap.has(envioId)) {
                enviosMap.set(envioId, {
                    id: envioId,
                    numeroSeguimiento: `ENV-${envioId}`,
                    fechaEnvio: r.Fecha_de_envio,
                    fechaEntrega: r.Fecha_de_entrega,
                    costo: r.Costo,
                    destinatario: r.Nombre_destinatario,
                    estado: estadoMap[r.Estado] || 'en_proceso',
                    direccionDestino: r.Direccion_de_destino,
                    ventaId: r.ID_venta,
                    productos: []
                });
            }
            const envio = enviosMap.get(envioId);
            // Si hay información de producto, añadirla
            if (r.ProductoID) {
                envio.productos.push({
                    id: r.ProductoID,
                    nombre: r.Producto_nombre || 'Producto enviado',
                    imagen: r.Producto_imagen || 'imagenes/producto-default.jpg',
                    cantidad: Number(r.Cantidad || 1)
                });
            }
        });

        const envios = Array.from(enviosMap.values());
        res.json({ success: true, envios });
    });
};