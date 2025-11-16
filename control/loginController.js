const crypto = require('crypto');

exports.ingresarUsuario = (req, res) => {
    const db = req.db;
    const { correo, password } = req.body;

    console.log('=== INICIO LOGIN ===');
    console.log('Correo:', correo);

    if (!correo || !password) {
        return res.json({ success: false, message: 'Correo y contraseña requeridos' });
    }

    // Encriptar la contraseña para comparar
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    
    db.query(
        'SELECT * FROM account WHERE Correo = ? AND Contraseña = ?',
        [correo, passwordHash],
        (err, results) => {
            if (err) {
                console.error('Error en la consulta:', err);
                return res.json({ success: false, message: 'Error en el servidor' });
            }
            
            console.log('Resultados encontrados:', results.length);
            
            if (results.length > 0) {
                const usuario = results[0];
                
                // Verificar que el usuario esté activo
                if (usuario.Activo !== 1) {
                    console.log('Usuario inactivo - Activo:', usuario.Activo);
                    return res.json({ success: false, message: 'Cuenta desactivada. Contacta con administración' });
                }
                
                // Guardar en sesión
                req.session.usuario = {
                    id: usuario.ID_login,
                    nombre: usuario.Nombre || '',
                    apellido: usuario.Apellido || '',
                    correo: usuario.Correo || '',
                    telefono: usuario.Telefono || '',
                    fecha_nacimiento: usuario.Fecha_de_nacimiento || '',
                    direccion: usuario.Direccion || '',
                    ID_cliente: usuario.ID_cliente || null,
                    ID_empleado: usuario.ID_empleado || null
                };
                
                // Guardar también una referencia rápida al id (compatibilidad con rama compras)
                req.session.usuarioId = usuario.ID_login;
                                
                // Guardar sesión explícitamente con mejor manejo de errores
                try {
                    req.session.save((err) => {
                        if (err) {
                            console.error('Error al guardar sesión:', err);
                            return res.json({ success: false, message: 'Error al guardar sesión' });
                        }
                        
                        return res.json({ 
                            success: true, 
                            usuario: req.session.usuario 
                        });
                    });
                } catch (e) {
                    console.warn('Error crítico al guardar sesión:', e);
                    return res.json({ success: false, message: 'Error crítico al guardar sesión' });
                }
            } else {
                return res.json({ success: false, message: 'Correo o contraseña incorrectos' });
            }
        }
    );
};