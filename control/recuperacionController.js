const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Función para generar hash SHA-256 (IGUAL que en loginController)
function sha256(str) {
    return crypto.createHash('sha256').update(str).digest('hex');
}

// Asegurar que existe la tabla para tokens de recuperación
function ensureResetTable(db, cb) {
    const sql = `
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ID_login INT NOT NULL,
            token_hash VARCHAR(64) NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX (token_hash),
            INDEX (expires_at),
            INDEX (ID_login)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    db.query(sql, (err) => {
        cb(err);
    });
}

// Configurar el transportador de correo
function getMailer() {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) return null;
    return nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: Number(SMTP_PORT) === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS }
    });
}

// Enviar correo de recuperación
async function sendResetEmail(to, resetUrl) {
    const transporter = getMailer();
    if (!transporter) {
        console.log('⚠️  SMTP no configurado. Enlace de recuperación:', resetUrl);
        return false;
    }
    
    console.log('📧 Intentando enviar email a:', to);
    console.log('🔗 URL de recuperación:', resetUrl);
    
    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || `"Febri" <${process.env.SMTP_USER}>`,
            to,
            subject: 'Recuperación de contraseña - Febri',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #ec4899;">Recuperación de contraseña</h2>
                    <p>Hola,</p>
                    <p>Has solicitado recuperar tu contraseña en Febri. Haz clic en el siguiente botón:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background-color: #ec4899; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Cambiar contraseña</a>
                    </div>
                    <p style="color: #666; font-size: 14px;">Este enlace es válido por 30 minutos.</p>
                    <p style="color: #666; font-size: 14px;">Si no solicitaste este cambio, ignora este correo.</p>
                </div>
            `
        });
        console.log('✓ Email enviado exitosamente');
        console.log('✓ Message ID:', info.messageId);
        return true;
    } catch (error) {
        console.error('✗ Error al enviar email:', error.message);
        console.log('Copia este enlace manualmente:', resetUrl);
        return false;
    }
}

// Solicitar recuperación de contraseña
exports.solicitarRecuperacion = (req, res) => {
    const db = req.db;
    const { email } = req.body;
    
    console.log('=== SOLICITUD RECUPERACIÓN ===');
    console.log('Email:', email);
    
    if (!email) {
        return res.status(400).json({ success: false, message: 'Correo electrónico requerido' });
    }
    
    db.query('SELECT ID_login FROM account WHERE Correo = ?', [email], (err, results) => {
        if (err) {
            console.error('Error en consulta:', err);
            return res.status(500).json({ success: false, message: 'Error en el servidor' });
        }
        
        if (results.length === 0) {
            console.log('✗ No existe cuenta con ese correo');
            return res.json({ success: false, message: 'No existe una cuenta con ese correo' });
        }
        
        const idLogin = results[0].ID_login;
        console.log('✓ Usuario encontrado, ID:', idLogin);
        
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = sha256(token);
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
        
        ensureResetTable(db, (err) => {
            if (err) {
                console.error('Error creando tabla:', err);
                return res.status(500).json({ success: false, message: 'Error en el servidor' });
            }
            
            // Eliminar tokens anteriores
            db.query('DELETE FROM password_reset_tokens WHERE ID_login = ?', [idLogin], () => {
                // Insertar nuevo token
                db.query(
                    'INSERT INTO password_reset_tokens (ID_login, token_hash, expires_at) VALUES (?, ?, ?)',
                    [idLogin, tokenHash, expiresAt],
                    async (err2) => {
                        if (err2) {
                            console.error('Error guardando token:', err2);
                            return res.status(500).json({ success: false, message: 'Error en el servidor' });
                        }
                        
                        const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
                        const resetUrl = `${baseUrl}/cambiar-password.html?token=${token}`;
                        
                        console.log('✓ Token generado y guardado');
                        const enviado = await sendResetEmail(email, resetUrl);
                        
                        if (enviado) {
                            console.log('✓ Correo enviado');
                            return res.json({ success: true, message: 'Correo de recuperación enviado' });
                        } else {
                            console.log('⚠️  Correo no enviado, pero token generado');
                            return res.json({ 
                                success: true, 
                                message: 'Enlace de recuperación generado',
                                resetUrl // Solo en desarrollo
                            });
                        }
                    }
                );
            });
        });
    });
};

// Validar token de recuperación
exports.validarToken = (req, res) => {
    const db = req.db;
    const token = (req.query.token || '').trim();
    
    console.log('=== VALIDANDO TOKEN ===');
    
    if (!token) {
        console.log('✗ Falta token');
        return res.status(400).json({ valid: false, message: 'Falta token' });
    }
    
    ensureResetTable(db, (err) => {
        if (err) {
            return res.status(500).json({ valid: false });
        }
        
        const tokenHash = sha256(token);
        db.query('SELECT expires_at FROM password_reset_tokens WHERE token_hash = ?', [tokenHash], (err2, rows) => {
            if (err2) {
                return res.status(500).json({ valid: false });
            }
            
            if (rows.length === 0) {
                console.log('✗ Token no encontrado');
                return res.json({ valid: false, message: 'Token inválido' });
            }
            
            const expiresAt = new Date(rows[0].expires_at);
            const now = new Date();
            
            if (now > expiresAt) {
                console.log('✗ Token expirado');
                return res.json({ valid: false, message: 'Token expirado' });
            }
            
            console.log('✓ Token válido');
            return res.json({ valid: true });
        });
    });
};

// Cambiar contraseña - IMPORTANTE: Usar el mismo hash que login
exports.cambiarPassword = (req, res) => {
    const db = req.db;
    const { token, password } = req.body;
    
    console.log('=== CAMBIANDO CONTRASEÑA ===');
    
    if (!token || !password) {
        return res.status(400).json({ success: false, message: 'Token y contraseña requeridos' });
    }
    
    if (password.length < 8) {
        return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 8 caracteres' });
    }
    
    ensureResetTable(db, (err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error en el servidor' });
        }
        
        const tokenHash = sha256(token);
        db.query(
            'SELECT ID_login, expires_at FROM password_reset_tokens WHERE token_hash = ?',
            [tokenHash],
            (err2, rows) => {
                if (err2) {
                    return res.status(500).json({ success: false, message: 'Error en el servidor' });
                }
                
                if (rows.length === 0) {
                    console.log('✗ Token no válido');
                    return res.status(400).json({ success: false, message: 'Token inválido' });
                }
                
                const registro = rows[0];
                const expiresAt = new Date(registro.expires_at);
                const now = new Date();
                
                if (now > expiresAt) {
                    console.log('✗ Token expirado');
                    return res.status(400).json({ success: false, message: 'Token expirado' });
                }
                
                // IMPORTANTE: Usar SHA-256 igual que loginController
                const passwordHash = sha256(password);
                
                console.log('Actualizando contraseña para ID_login:', registro.ID_login);
                console.log('Nuevo hash:', passwordHash);
                
                db.query('UPDATE account SET Contraseña = ? WHERE ID_login = ?', [passwordHash, registro.ID_login], (err3, result) => {
                    if (err3) {
                        console.error('Error actualizando contraseña:', err3);
                        return res.status(500).json({ success: false, message: 'Error al actualizar contraseña' });
                    }
                    
                    console.log('✓ Contraseña actualizada, filas afectadas:', result.affectedRows);
                    
                    // Eliminar el token usado
                    db.query('DELETE FROM password_reset_tokens WHERE ID_login = ?', [registro.ID_login], () => {
                        console.log('✓ Token eliminado');
                        console.log('=== FIN CAMBIO CONTRASEÑA ===');
                        return res.json({ success: true, message: 'Contraseña actualizada correctamente' });
                    });
                });
            }
        );
    });
};