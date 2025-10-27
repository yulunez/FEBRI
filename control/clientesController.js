exports.mostrarClientes = (req, res) => {
    const db = req.db;
    const sql = `SELECT
                acc.ID_cliente AS id_cliente,
                acc.Nombre AS nombre,
                acc.Apellido AS apellido,
                acc.Correo AS correo,
                acc.Telefono AS telefono,
                acc.Direccion AS direccion,
                acc.Fecha_de_nacimiento AS fecha_nacimiento,
                c.ID_cliente AS cliente_id
                FROM account acc
                JOIN cliente c ON acc.id_cliente = c.id_cliente;`;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error en consulta mostrarClientes:', err);
            return res.status(500).json({ success: false, message: 'Error en la base de datos' });
        }
        const clientes = Array.isArray(results) ? results.map(r => ({
            id_cliente: r.id_cliente,
            // unimos en nombre el nombre y apellido
            nombre_completo: r.nombre + ' ' + r.apellido,
            correo: r.correo,
            telefono: r.telefono,
            direccion: r.direccion,
            fecha_nacimiento: r.fecha_nacimiento,
            cliente_id: r.cliente_id
        })) : [];
        res.json({ success: true, clientes });
    });
};