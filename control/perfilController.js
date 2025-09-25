const db = req.db;

exports.editarUsuario = (req, res)=> {
    const {id} = req.params;
    const {nombre, apellido, correo, telefono, direccion, fecha} = req.body;

    const 
}