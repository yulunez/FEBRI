const crypto = require('crypto');

// Crear perfil para usuarios nuevos de Google/Facebook
exports.crearPerfil = (req, res) => {
    const db = req.db;
    const { nombre, apellidos, correo, telefono, direccion, fecha } = req.body;

    console.log('=== CREANDO PERFIL NUEVO ===');
    console.log('Datos recibidos:', { nombre, apellidos, correo, telefono, direccion, fecha });

    if (!req.session || !req.session.usuario) {
        return res.json({ success: false, message: 'No hay sesión activa' });
    }

    // Generar una contraseña temporal (el usuario puede cambiarla después)
    const passwordTemp = crypto.randomBytes(16).toString('hex');
    const passwordHash = crypto.createHash('sha256').update(passwordTemp).digest('hex');

    // Insertar en la base de datos
    db.query(
        `INSERT INTO account (Nombre, Apellido, Correo, Contraseña, Telefono, Direccion, Fecha_de_nacimiento) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [nombre, apellidos, correo, passwordHash, telefono, direccion, fecha],
        (err, result) => {
            if (err) {
                console.error('Error al crear perfil:', err);
                return res.json({ success: false, message: 'Error al crear perfil' });
            }

            const nuevoId = result.insertId;
            console.log('Perfil creado con ID:', nuevoId);

            // Actualizar la sesión
            req.session.usuario = {
                id: nuevoId,
                nombre: nombre,
                apellido: apellidos,
                correo: correo,
                telefono: telefono,
                direccion: direccion,
                fecha_nacimiento: fecha,
                esNuevo: false
            };

            req.session.save((err) => {
                if (err) {
                    console.error('Error al guardar sesión:', err);
                }
                console.log('✓ Perfil creado y sesión actualizada');
                console.log('=== FIN CREAR PERFIL ===');
                
                return res.json({ 
                    success: true, 
                    message: 'Perfil creado correctamente',
                    usuario: req.session.usuario
                });
            });
        }
    );
};

// Editar perfil existente
exports.editarUsuario = (req, res) => {
    const db = req.db;
    const { id } = req.params;
    const { nombre, apellidos, correo, telefono, direccion, fecha } = req.body;

    console.log('=== EDITANDO PERFIL ===');
    console.log('ID:', id);
    console.log('Datos:', { nombre, apellidos, correo, telefono, direccion, fecha });

    if (!req.session || !req.session.usuario) {
        return res.json({ success: false, message: 'No hay sesión activa' });
    }

    // Actualizar en la base de datos
    db.query(
        `UPDATE account SET 
            Nombre = ?, 
            Apellido = ?, 
            Correo = ?, 
            Telefono = ?, 
            Direccion = ?, 
            Fecha_de_nacimiento = ? 
        WHERE ID_login = ?`,
        [nombre, apellidos, correo, telefono, direccion, fecha, id],
        (err, result) => {
            if (err) {
                console.error('Error al actualizar:', err);
                return res.json({ success: false, message: 'Error al actualizar' });
            }

            console.log('Filas afectadas:', result.affectedRows);

            // Actualizar la sesión
            req.session.usuario = {
                ...req.session.usuario,
                id: id,
                nombre: nombre,
                apellido: apellidos,
                correo: correo,
                telefono: telefono,
                direccion: direccion,
                fecha_nacimiento: fecha
            };

            req.session.save((err) => {
                if (err) {
                    console.error('Error al guardar sesión:', err);
                }
                console.log('✓ Perfil actualizado');
                console.log('=== FIN EDITAR PERFIL ===');
                
                return res.json({ 
                    success: true, 
                    message: 'Perfil actualizado correctamente',
                    usuario: req.session.usuario
                });
            });
        }
    );
};