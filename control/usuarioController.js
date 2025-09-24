const crypto = require('crypto');
const { randomUUID } = require('crypto');

exports.registrarUsuario = (req, res) => {
    const db = req.db;
    const { nombre, correo, direccion, telefono, apellidos, password, fecha_nacimiento } = req.body;

    // Validar correo
    if (!correo || !correo.includes('@')) {
        return res.json({ success: false, message: 'Correo inválido' });
    }

    // Generar id único
    const idUnico = randomUUID();
    const idEmpleado = 2;
    const idCliente = 1;
    const idRolNull = null;
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    // Si es @febri.com → empleados, si no → clientes
    if (correo.endsWith('@febri.com')) {
        db.query(
            'INSERT INTO empleado (ID_empleado, ID_rol) VALUES (?, ?)',
            [idUnico, idEmpleado],
            (err) => {
                if (err) {
                    console.error('Error al insertar en empleados:', err);
                    return res.json({ success: false, message: 'Error al insertar en empleados' });

}                
                db.query(
                    `INSERT INTO account 
                    (Usuario, Contraseña, Nombre, Apellido, Direccion, Correo, Telefono, Fecha_de_nacimiento, ID_empleado, ID_cliente) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [correo, passwordHash, nombre, apellidos, direccion, correo, telefono, fecha_nacimiento, idUnico, idRolNull],
                    (err2) => {
                        if (err2) {
                            console.error('Error al insertar en account:', err2);
                            return res.json({ success: false, message: 'Error al insertar en account' });
                        }
                        console.log('Usuario registrado con éxito (empleado)');
                        return res.json({ success: true, tipo: 'empleado', id: idUnico });
                    }
                );
            }
        );
    } else {
        db.query(
            'INSERT INTO cliente (ID_cliente, ID_rol) VALUES (?, ?)',
            [idUnico, idCliente],
            (err) => {
                if (err) {
                    console.error('Error al insertar en clientes:', err);
                    return res.json({ success: false, message: 'Error al insertar en clientes' });
                }

                db.query(
                    `INSERT INTO account 
                    (Usuario, Contraseña, Nombre, Apellido, Direccion, Correo, Telefono, Fecha_de_nacimiento, ID_empleado, ID_cliente) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [correo, passwordHash, nombre, apellidos, direccion, correo, telefono, fecha_nacimiento, idRolNull, idUnico],
                    (err2) => {
                        if (err2) {
                            console.error('Error al insertar en account:', err2);
                            return res.json({ success: false, message: 'Error al insertar en account' });
                        }
                        console.log('Usuario registrado con éxito (cliente)');
                        return res.json({ success: true, tipo: 'cliente', id: idUnico });
                    }
                );
            }
        );
    }
};