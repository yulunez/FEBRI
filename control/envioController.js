// Función interna para generar envío desde comprasController (usado en transacción)
exports.generarEnvioInterno = (db, { direccion, costo, nombre, clienteId, ventaId }) => {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO envio (Direccion_de_destino, Fecha_de_envio, costo, Nombre_destinatario, Estado, ID_cliente, ID_venta, ID_empresa) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        const estado = 'pendiente';
        // Para estado pendiente, fecha_envio es null
        db.query(sql, [direccion, null, costo, nombre, estado, clienteId, ventaId, null], (err, result) => {
            if (err) {
                console.error('Error al generar el envío:', err);
                return reject(err);
            }
            console.log('Envío generado con ID:', result.insertId);
            resolve(result.insertId);
        });
    });
};

// Endpoint REST para generar envío manualmente (si es necesario)
exports.generarEnvio = (req, res) => {
    const { Direccion_de_destino, costo, Nombre_destinatario, ID_cliente, ID_venta } = req.body;
    
    exports.generarEnvioInterno(req.db, {
        direccion: Direccion_de_destino,
        costo,
        nombre: Nombre_destinatario,
        clienteId: ID_cliente,
        ventaId: ID_venta
    }).then(envioId => {
        res.json({ success: true, mensaje: 'Envío generado exitosamente', envioId });
    }).catch(err => {
        res.status(500).json({ success: false, mensaje: 'Error al generar el envío', error: err.message });
    });
};

exports.obtenerEnviosPorCliente = (req, res) => {
    const db = req.db;
    const { ID_cliente } = req.params;
    const sql = 'SELECT * FROM envio WHERE ID_cliente = ?';
    db.query(sql, [ID_cliente], (err, results) => {
        if (err) {
            console.error('Error al obtener los envíos del cliente:', err);
            return res.status(500).json({ success: false, mensaje: 'Error al obtener los envíos' });
        }
        res.json({ success: true, envios: results });
    });
};  
