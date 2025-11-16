const crypto = require('crypto');
const { randomUUID } = require('crypto');

exports.registrarUsuario = (req, res) => {
    const db = req.db;
    const { nombre, correo, direccion, telefono, apellidos, password, fecha_nacimiento } = req.body;
    // Allow admin to force the tipo: 'empleado' or 'cliente'
    const tipoForzado = req.body.tipo;

    // Validar correo
    if (!correo || !correo.includes('@')) {
        return res.json({ success: false, message: 'Correo inválido' });
    }

    // Generate password hash
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    
    // Concatenate nombre and apellido for cliente/empleado table
    const nombreCompleto = `${nombre} ${apellidos}`.trim();

    // Decide whether to create empleado or cliente. Priority:
    // 1) tipoForzado (from admin UI) === 'empleado' | 'cliente'
    // 2) fallback to email domain ending with @febri.com
    const crearComoEmpleado = (tipoForzado === 'empleado') || (tipoForzado !== 'cliente' && correo && correo.endsWith('@febri.com'));

    // Use a transaction to ensure both inserts succeed or none
    db.beginTransaction((txErr) => {
        if (txErr) {
            console.error('Error starting transaction:', txErr);
            return res.json({ success: false, message: 'Error en el servidor' });
        }

        if (crearComoEmpleado) {
            // Insert empleado with full name, get insertId and use it in account
            db.query('INSERT INTO empleado (Nombre, ID_rol) VALUES (?, ?)', [nombreCompleto, 2], (err, result) => {
                if (err) {
                    console.error('Error al insertar en empleados:', err);
                    return db.rollback(() => res.json({ success: false, message: 'Error al insertar en empleados' }));
                }
                const nuevoIdEmpleado = result.insertId;
                const sqlAccount = `INSERT INTO account (Usuario, Contraseña, Nombre, Apellido, Direccion, Correo, Telefono, Fecha_de_nacimiento, ID_empleado, ID_cliente) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                const params = [correo, passwordHash, nombre, apellidos, direccion, correo, telefono, fecha_nacimiento, nuevoIdEmpleado, null];
                db.query(sqlAccount, params, (err2) => {
                    if (err2) {
                        console.error('Error al insertar en account (empleado):', err2);
                        return db.rollback(() => res.json({ success: false, message: 'Error al insertar en cuenta' }));
                    }
                    db.commit((commitErr) => {
                        if (commitErr) {
                            console.error('Commit error:', commitErr);
                            return db.rollback(() => res.json({ success: false, message: 'Error al guardar cambios' }));
                        }
                        console.log('Usuario registrado con éxito (empleado) id_empleado=', nuevoIdEmpleado);
                        return res.json({ success: true, tipo: 'empleado', id_empleado: nuevoIdEmpleado });
                    });
                });
            });
        } else {
            // Insert cliente with full name, get insertId and use it in account
            db.query('INSERT INTO cliente (Nombre, ID_rol) VALUES (?, ?)', [nombreCompleto, 1], (err, result) => {
                if (err) {
                    console.error('Error al insertar en clientes:', err);
                    return db.rollback(() => res.json({ success: false, message: 'Error al insertar en clientes' }));
                }
                const nuevoIdCliente = result.insertId;
                const sqlAccount = `INSERT INTO account (Usuario, Contraseña, Nombre, Apellido, Direccion, Correo, Telefono, Fecha_de_nacimiento, Activo, ID_empleado, ID_cliente) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                const params = [correo, passwordHash, nombre, apellidos, direccion, correo, telefono, fecha_nacimiento, 1, null, nuevoIdCliente];
                db.query(sqlAccount, params, (err2) => {
                    if (err2) {
                        console.error('Error al insertar en account (cliente):', err2);
                        return db.rollback(() => res.json({ success: false, message: 'Error al insertar en cuenta' }));
                    }
                    db.commit((commitErr) => {
                        if (commitErr) {
                            console.error('Commit error:', commitErr);
                            return db.rollback(() => res.json({ success: false, message: 'Error al guardar cambios' }));
                        }
                        console.log('Usuario registrado con éxito (cliente) id_cliente=', nuevoIdCliente);
                        return res.json({ success: true, tipo: 'cliente', id_cliente: nuevoIdCliente });
                    });
                });
            });
        }
    });
};