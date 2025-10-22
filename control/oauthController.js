const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;

module.exports.configurePassport = function(db) {
    
    // Estrategia de Google
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
        console.log('=== LOGIN GOOGLE ===');
        console.log('Perfil de Google:', profile.displayName, profile.emails[0].value);
        
        const email = profile.emails[0].value;
        const nombres = profile.name.givenName || '';
        const apellidos = profile.name.familyName || '';
        
        // Buscar si el usuario ya existe en la base de datos
        db.query('SELECT * FROM account WHERE Correo = ?', [email], (err, results) => {
            if (err) {
                console.error('Error al buscar usuario:', err);
                return done(err);
            }
            
            if (results.length > 0) {
                // Usuario YA EXISTE en la BD - Cargar TODA su información
                const usuarioExistente = results[0];
                console.log('✓ Usuario encontrado en BD con toda su información');
                
                const usuario = {
                    id: usuarioExistente.ID_login,
                    nombre: usuarioExistente.Nombre || nombres,
                    apellido: usuarioExistente.Apellido || apellidos,
                    correo: usuarioExistente.Correo,
                    telefono: usuarioExistente.Telefono || '',
                    fecha_nacimiento: usuarioExistente.Fecha_de_nacimiento || '',
                    direccion: usuarioExistente.Direccion || '',
                    ID_cliente: usuarioExistente.ID_cliente || null,
                    ID_empleado: usuarioExistente.ID_empleado || null,
                    esNuevo: false // Indica que tiene datos completos
                };
                
                console.log('Usuario con datos completos:', usuario);
                return done(null, usuario);
                
            } else {
                // Usuario NUEVO - Solo tiene datos de Google
                console.log('✓ Usuario nuevo, solo con datos de Google');
                
                const usuarioNuevo = {
                    id: null, // No tiene ID en BD aún
                    nombre: nombres,
                    apellido: apellidos,
                    correo: email,
                    telefono: '',
                    fecha_nacimiento: '',
                    direccion: '',
                    ID_cliente: null,
                    ID_empleado: null,
                    esNuevo: true // Indica que solo tiene nombre y correo
                };
                
                console.log('Usuario nuevo (datos limitados):', usuarioNuevo);
                return done(null, usuarioNuevo);
            }
        });
    }));

    // Estrategia de Facebook
    passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: "/auth/facebook/callback",
        profileFields: ['id', 'emails', 'name']
    },
    async (accessToken, refreshToken, profile, done) => {
        console.log('=== LOGIN FACEBOOK ===');
        console.log('Perfil de Facebook:', profile.displayName);
        
        const email = profile.emails?.[0]?.value || '';
        const nombres = profile.name?.givenName || '';
        const apellidos = profile.name?.familyName || '';
        
        if (!email) {
            return done(new Error('No se pudo obtener el email de Facebook'));
        }
        
        // Buscar si el usuario ya existe en la base de datos
        db.query('SELECT * FROM account WHERE Correo = ?', [email], (err, results) => {
            if (err) {
                console.error('Error al buscar usuario:', err);
                return done(err);
            }
            
            if (results.length > 0) {
                // Usuario YA EXISTE en la BD
                const usuarioExistente = results[0];
                console.log('✓ Usuario encontrado en BD con toda su información');
                
                const usuario = {
                    id: usuarioExistente.ID_login,
                    nombre: usuarioExistente.Nombre || nombres,
                    apellido: usuarioExistente.Apellido || apellidos,
                    correo: usuarioExistente.Correo,
                    telefono: usuarioExistente.Telefono || '',
                    fecha_nacimiento: usuarioExistente.Fecha_de_nacimiento || '',
                    direccion: usuarioExistente.Direccion || '',
                    ID_cliente: usuarioExistente.ID_cliente || null,
                    ID_empleado: usuarioExistente.ID_empleado || null,
                    esNuevo: false
                };
                
                console.log('Usuario con datos completos:', usuario);
                return done(null, usuario);
                
            } else {
                // Usuario NUEVO
                console.log('✓ Usuario nuevo, solo con datos de Facebook');
                
                const usuarioNuevo = {
                    id: null,
                    nombre: nombres,
                    apellido: apellidos,
                    correo: email,
                    telefono: '',
                    fecha_nacimiento: '',
                    direccion: '',
                    ID_cliente: null,
                    ID_empleado: null,
                    esNuevo: true
                };
                
                console.log('Usuario nuevo (datos limitados):', usuarioNuevo);
                return done(null, usuarioNuevo);
            }
        });
    }));

    // Serializar usuario
    passport.serializeUser((user, done) => {
        console.log('Serializando usuario:', user.correo);
        done(null, user);
    });

    // Deserializar usuario
    passport.deserializeUser((user, done) => {
        console.log('Deserializando usuario:', user.correo);
        done(null, user);
    });
};