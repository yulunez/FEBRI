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
    console.log('Datos recibidos:', { nombre, apellidos, correo, telefono, direccion, fecha });

    // Validar sesión
    if (!req.session || !req.session.usuario) {
        return res.json({ success: false, message: 'No hay sesión activa' });
    }

    // Validar ID
    if (!id) {
        return res.json({ success: false, message: 'ID de usuario no proporcionado' });
    }

    // Verificar correo duplicado
    const verificarCorreo = `
        SELECT ID_login 
        FROM account 
        WHERE Correo = ? 
        AND ID_login != ?
    `;

    db.query(verificarCorreo, [correo, id], (err, results) => {
        if (err) {
            console.error('Error al verificar correo:', err);
            return res.json({ success: false, message: 'Error al verificar correo' });
        }

        if (results.length > 0) {
            return res.json({ success: false, message: 'El correo ya está en uso' });
        }

        // Actualizar perfil
        // Use NULLIF(..., '') so that empty strings from the client do not overwrite existing DB values
        const updateQuery = `
            UPDATE account 
            SET Nombre = COALESCE(NULLIF(?, ''), Nombre),
                Apellido = COALESCE(NULLIF(?, ''), Apellido),
                Correo = COALESCE(NULLIF(?, ''), Correo),
                Telefono = COALESCE(NULLIF(?, ''), Telefono),
                Direccion = COALESCE(NULLIF(?, ''), Direccion),
                Fecha_de_nacimiento = COALESCE(NULLIF(?, ''), Fecha_de_nacimiento)
            WHERE ID_login = ?
        `;

        // If telefono is provided, check column type and ALTER to VARCHAR(20) if needed
        const ensureTelefonoColumn = (phoneVal, cb) => {
            if (!phoneVal) return cb(null);

            // Query information_schema to detect column type
            const q = `SELECT DATA_TYPE, COLUMN_TYPE
                       FROM information_schema.columns
                       WHERE table_schema = DATABASE()
                         AND table_name = 'account'
                         AND column_name = 'Telefono'`;

            db.query(q, (err, rows) => {
                if (err) {
                    console.error('Error leyendo information_schema para Telefono:', err);
                    return cb(err);
                }

                if (!rows || rows.length === 0) return cb(null);

                const info = rows[0];
                const dataType = (info.DATA_TYPE || '').toLowerCase();
                console.log('Tipo actual de columna Telefono:', dataType, info.COLUMN_TYPE);

                // If it's an integer type and the provided phone won't fit in signed INT, change to VARCHAR(20)
                const phoneNum = Number(String(phoneVal).replace(/\D/g, ''));
                const needsAlter = (dataType === 'int' || dataType === 'tinyint' || dataType === 'mediumint')
                    && (!Number.isFinite(phoneNum) || phoneNum > 2147483647);

                if (!needsAlter) return cb(null);

                const alter = `ALTER TABLE account MODIFY COLUMN Telefono VARCHAR(20)`;
                console.log('Alterando columna Telefono a VARCHAR(20) porque el valor no cabe en INT');
                db.query(alter, (err2) => {
                    if (err2) {
                        console.error('Error al alterar la columna Telefono:', err2);
                        return cb(err2);
                    }
                    console.log('Columna Telefono alterada a VARCHAR(20)');
                    return cb(null);
                });
            });
        };

        ensureTelefonoColumn(telefono, (ensureErr) => {
            if (ensureErr) {
                console.error('Fallo al asegurar tipo de columna Telefono:', ensureErr);
                // proceed anyway and let UPDATE report errors
            }

            const params = [nombre, apellidos, correo, telefono, direccion, fecha, id];
            console.log('Ejecutando UPDATE account con params:', params);

            db.query(updateQuery, params, (err, result) => {
            if (err) {
                console.error('Error al actualizar:', err);
                return res.json({ 
                    success: false, 
                    message: 'Error al actualizar perfil', 
                    error: err.message 
                });
            }

            console.log('Filas afectadas (UPDATE):', result.affectedRows);

            if (result.affectedRows === 0) {
                // No rows changed — still attempt to SELECT so we can log current DB values for debugging
                console.log('UPDATE no cambió filas, leyendo valores actuales para diagnóstico');
            }

            // Consultar los datos actualizados (o actuales) y loguearlos para diagnóstico
            db.query('SELECT * FROM account WHERE ID_login = ?', [id], (err, rows) => {
                if (err) {
                    console.error('Error al obtener datos actualizados:', err);
                    return res.json({ 
                        success: false, 
                        message: 'Error al obtener datos actualizados' 
                    });
                }

                if (rows.length === 0) {
                    return res.json({ 
                        success: false, 
                        message: 'No se encontró el usuario después de actualizar' 
                    });
                }

                const usuarioActualizado = rows[0];
                console.log('Valores obtenidos de la tabla account después del UPDATE:', usuarioActualizado);

                // Actualizar la sesión con los datos de la base de datos
                req.session.usuario = {
                    ...req.session.usuario,
                    id: usuarioActualizado.ID_login,
                    nombre: usuarioActualizado.Nombre,
                    apellido: usuarioActualizado.Apellido,
                    correo: usuarioActualizado.Correo,
                    telefono: usuarioActualizado.Telefono,
                    direccion: usuarioActualizado.Direccion,
                    fecha_nacimiento: usuarioActualizado.Fecha_de_nacimiento
                };

                req.session.save((err) => {
                    if (err) {
                        console.error('Error al guardar sesión:', err);
                        return res.json({ 
                            success: false, 
                            message: 'Error al actualizar la sesión' 
                        });
                    }
                    return res.json({
                        success: true,
                        message: 'Perfil actualizado correctamente',
                        usuario: req.session.usuario
                    });
                });
            });
        }); // end updateQuery callback
        }); // end ensureTelefonoColumn callback
    }); // end verificarCorreo db.query
};
    