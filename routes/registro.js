const express = require('express');
const router = express.Router();
const crypto = require('crypto');

module.exports = (db) => {
    router.post('/', (req, res) => {
        const { nombre ,correo, direccion, telefono, apellidos, password, fecha_nacimiento } = req.body;

        // Validar correo
        if (!correo || (!correo.includes('@'))) {
            return res.json({ success: false, message: 'Correo inválido' });
        }

        // Generar id único
        const idUnico = crypto.randomUUID();
        const idRolNull = null
        const idEmpleado = 2
        const idCliente = 1
        const passwordHash = crypto.createHash('sha256').update(password).digest('hex');


        // Si es @febri.com va en empleados, si no va en clientes
        if (correo.endsWith('@febri.com')) {
            db.query('INSERT INTO empleados (id, id_rol) VALUES (?, ?)', [idUnico, idEmpleado], (err) => {
                if (err) return res.json({ success: false, message: 'Error al insertar en empleados' });
                res.json({ success: true, tipo: 'empleado', id: idUnico });
            });
            db.query('INSERT INTO account (ID_login, Usuario, Contraseña, Nombre, Apellido, Direccion, Correo, Telefono, Fecha_de_nacimiento, ID_empleado, ID_cliente) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [idUnico, correo, passwordHash, nombre, apellidos, direccion, correo, telefono, fecha_nacimiento, idUnico, idRolNull], (err) => {
                if (err) {
                    console.error('Error al insertar en account:', err);
                    return res.json({ success: false, message: 'Error al insertar en account' });
                }
                console.log('Usuario registrado con éxito');
            });            
        } else {
            db.query('INSERT INTO clientes (id, id_rol) VALUES (?, ?)', [idUnico, idCliente], (err) => {
                if (err) return res.json({ success: false, message: 'Error al insertar en clientes' });
                res.json({ success: true, tipo: 'cliente', id: idUnico });
            });
            db.query('INSERT INTO account (ID_login, Usuario, Contraseña, Nombre, Apellido, Direccion, Correo, Telefono, Fecha_de_nacimiento, ID_empleado, ID_cliente) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [idUnico, correo, passwordHash, nombre, apellidos, direccion, correo, telefono, fecha_nacimiento, idRolNull, idUnico], (err) => {
                if (err) {
                    console.error('Error al insertar en account:', err);
                    return res.json({ success: false, message: 'Error al insertar en account' });
                }
                console.log('Usuario registrado con éxito');
            }); 
        }

    });

    return router;
};