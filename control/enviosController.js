exports.obtenerEnviosUsuario = (req, res) => {
    const db = req.db;
    // En sesión suele venir ID_usuario; si usas ID_cliente, también lo intento
    const userId =
        req.session?.usuario?.ID_usuario ??
        req.session?.usuario?.ID_cliente;

    if (!userId) {
        return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const sql = `
        SELECT 
            e.ID_envio,
            e.Direccion_de_destino,
            e.Fecha_de_envio,
            e.Fecha_de_entrega,
            e.Costo,
            e.Nombre_del_remitente,
            e.Nombre_del_destinatario,
            e.ID_estado,
            e.ID_venta,
            emp.ID_empresa,
            emp.Nombre AS empresa_nombre,
            emp.Telefono AS empresa_telefono,
            emp.Direccion AS empresa_direccion
        FROM envio e
        LEFT JOIN empresaenvio emp ON e.ID_empresa = emp.ID_empresa
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

        const envios = Array.isArray(results) ? results.map(r => ({
            id: r.ID_envio,
            numeroSeguimiento: `ENV-${r.ID_envio}`,
            fechaEnvio: r.Fecha_de_envio,
            fechaEntrega: r.Fecha_de_entrega,
            costo: r.Costo,
            remitente: r.Nombre_del_remitente,
            destinatario: r.Nombre_del_destinatario,
            estado: estadoMap[r.ID_estado] || 'en_proceso',
            direccionDestino: r.Direccion_de_destino,
            ventaId: r.ID_venta,
            empresa: {
                id: r.ID_empresa,
                nombre: r.empresa_nombre || 'Empresa',
                telefono: r.empresa_telefono || '',
                direccion: r.empresa_direccion || '',
                logo: null // si luego agregas columna logo, la usamos
            },
            // Sin detalle de productos en tu tabla, muestro iconos genéricos
            productos: [
                { nombre: 'Producto enviado', imagen: 'imagenes/producto-default.jpg', cantidad: 1 }
            ]
        })) : [];

        res.json({ success: true, envios });
    });
};