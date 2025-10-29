exports.mostrarEmpleados = (req, res) => {
    const db = req.db;
    const sql = `SELECT 
                    acc.ID_empleado,
                    acc.Nombre,
                    acc.Apellido,
                    acc.correo,
                    acc.Activo,
                    acc.Estado,
                    e.ID_rol,
                    r.Nombre AS rol
                FROM account acc
                JOIN empleado e ON acc.ID_empleado = e.ID_empleado
                JOIN rol r ON e.ID_rol = r.ID_rol;`
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error en consulta mostrarEmpleados:', err);
            return res.status(500).json({ success: false, message: 'Error en la base de datos' });
        }
        const empleados = Array.isArray(results) ? results.map(r => ({
            ID_empleado: r.ID_empleado,
            Nombre_completo: `${r.Nombre} ${r.Apellido}`,
            correo: r.correo,
            ID_rol: r.ID_rol,
            rol: r.rol,
            // keep both original-case and lowercase keys so frontend is robust
            Activo: typeof r.Activo !== 'undefined' ? r.Activo : null,
            Estado: typeof r.Estado !== 'undefined' ? r.Estado : null,
            activo: (typeof r.Activo !== 'undefined' && r.Activo !== null) ? Number(r.Activo) : (typeof r.activo !== 'undefined' ? Number(r.activo) : null),
            estado: (typeof r.Estado !== 'undefined' && r.Estado !== null) ? r.Estado : (typeof r.estado !== 'undefined' ? r.estado : null)
        })) : [];
        res.json({ success: true, empleados });
    });
}

// Alias para compatibilidad con la ruta que espera `obtenerEmpleados`
exports.obtenerEmpleados = exports.mostrarEmpleados;

exports.toggleEmpleadoActivo = (req, res) => {
    const db = req.db;
    const id = req.params.id;
    if (!id) return res.status(400).json({ success: false, message: 'ID empleado requerido' });

    // First, get an account row that references this empleado to know available columns
    const sel = 'SELECT ID_login, Activo, Estado FROM account WHERE ID_empleado = ? LIMIT 1';
    db.query(sel, [id], (err, rows) => {
        if (err) {
            console.error('Error comprobando account para toggle:', err);
            return res.status(500).json({ success: false, message: 'Error en la base de datos' });
        }
        if (!rows || rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Account no encontrada para este empleado' });
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