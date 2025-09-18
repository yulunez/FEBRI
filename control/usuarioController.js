const crypto = require('crypto');

exports.registrarUsuario = (req, res) => {
    const db = req.db;
    const { nombre, correo, direccion, telefono, apellidos, password, fecha_nacimiento } = req.body;

    // Validar correo
    if (!correo || (!correo.includes('@'))) {
        return res.json({ success: false, message: 'Correo inválido' });
    }

    // Generar id único
    const idUnico = randomUUID();
    const idRolNull = null;
    const idEmpleado = 2;
    const idCliente = 1;
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    // Si es @febri.com va en empleados, si no va en clientes
    if (correo.endsWith('@febri.com')) {
        db.query('INSERT INTO empleados (id, id_rol) VALUES (?, ?)', [idUnico, idEmpleado], (err) => {
            if (err) {
                return res.json({ success: false, message: 'Error al insertar en empleados' });
            }
            db.query('INSERT INTO account (Usuario, Contraseña, Nombre, Apellido, Direccion, Correo, Telefono, Fecha_de_nacimiento, ID_empleado, ID_cliente) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [correo, passwordHash, nombre, apellidos, direccion, correo, telefono, fecha_nacimiento, idUnico, idRolNull],
                (err2) => {
                    if (err2) {
                        console.error('Error al insertar en account:', err2);
                        return res.json({ success: false, message: 'Error al insertar en account' });
                    }
                    console.log('Usuario registrado con éxito');
                    return res.json({ success: true, tipo: 'empleado', id: idUnico });
                }
            );
        });
    } else {
        db.query('INSERT INTO clientes (id, id_rol) VALUES (?, ?)', [idUnico, idCliente], (err) => {
            if (err) {
                return res.json({ success: false, message: 'Error al insertar en clientes' });
            }
            db.query('INSERT INTO account (Usuario, Contraseña, Nombre, Apellido, Direccion, Correo, Telefono, Fecha_de_nacimiento, ID_empleado, ID_cliente) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [correo, passwordHash, nombre, apellidos, direccion, correo, telefono, fecha_nacimiento, idRolNull, idUnico],
                (err2) => {
                    if (err2) {
                        console.error('Error al insertar en account:', err2);
                        return res.json({ success: false, message: 'Error al insertar en account' });
                    }
                    console.log('Usuario registrado con éxito');
                    return res.json({ success: true, tipo: 'cliente', id: idUnico });
                }
            );
        });
    }
}
