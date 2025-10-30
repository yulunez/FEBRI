
const crypto = require('crypto');

exports.ingresarUsuario = (req, res) => {
    const db = req.db;
    const { correo, password } = req.body;

    if (!correo || !password) {
        return res.json({ success: false, message: 'Correo y contraseña requeridos' });
    }

    // Encriptar la contraseña para comparar
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    console.log(passwordHash);
    db.query(
        'SELECT * FROM account WHERE Correo = ? AND Contraseña = ?',
        [correo, passwordHash],
        (err, results) => {
            if (err) {
                console.error('Error en la consulta:', err);
                return res.json({ success: false, message: 'Error en el servidor' });
            }
                // Usuario encontrado
            if (results.length > 0) {
                const usuario = results[0];
                // Guardar en sesión
                req.session.usuario = {
                    id: usuario.ID,
                    nombre: usuario.Nombre,
                    apellido: usuario.Apellido,
                    correo: usuario.Correo,
                    telefono: usuario.Telefono,
                    fechaNacimiento: usuario.Fecha_de_nacimiento,
                    direccion: usuario.Direccion,
                    IdCliente: usuario.ID_cliente
                }
                // Guardar también una referencia rápida al id (compatibilidad con otras partes)
                try {
                    req.session.usuarioId = usuario.ID;
                } catch (e) { /* ignore session write errors */ }
                // Force-save the session and log important info for debugging session persistence
                try {
                    req.session.save(err => {
                        console.log('Login: session saved, sessionID=', req.sessionID, 'err=', err, 'session=', req.session);
                        return res.json({ success: true, usuario });
                    });
                } catch (e) {
                    console.warn('Login: error saving session', e);
                    return res.json({ success: true, usuario });
                }
            } else {
                // Usuario no encontrado
                return res.json({ success: false, message: 'Correo o contraseña incorrectos' });
            }
        }
    );
}