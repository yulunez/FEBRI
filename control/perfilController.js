exports.editarUsuario = (req, res)=> {
    const db = req.db;
    const {id} = req.params;
    const {nombre, apellidos, correo, telefono, direccion, fecha} = req.body;

    db.query(
        'UPDATE account SET Nombre = ?, Apellido = ?, Direccion = ?, Correo = ?, Telefono = ?, Fecha_de_nacimiento = ? WHERE ID = ?',
        [nombre, apellidos, direccion, correo, telefono, fecha, id],
        (err) => {
                        if (err) {
                            console.error('Error al insertar en account:', err);
                            return res.json({ success: false, message: 'Error al actualizar el usuario' });
                        }
                        console.log('Usuario actualizado con éxito');
                        return res.json({ success: true, tipo: 'cliente'});
                    }
    ) 
}