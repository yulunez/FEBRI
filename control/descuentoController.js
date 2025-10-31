exports.establecerDescuento = (req, res) => {
    const db = req.db;
    const { id_producto, descuento } = req.body;
    // Necesito que se revice en la tabla producto si existe el descuento o es nulo y si existe crear un nuevo precio con el descuento aplicado 
    // Validar descuento
    const descuentoNum = parseFloat(descuento);
    if (isNaN(descuentoNum) || descuentoNum < 0 || descuentoNum > 100) {
        return res.status(400).json({
            success: false,
            message: 'El descuento debe ser un número entre 0 y 100'
        });
    }
    // Actualizar el descuento en la base de datos
    const sql = 'UPDATE producto SET Descuento = ? WHERE ID_producto = ?';
    db.query(sql, [descuentoNum, id_producto], (err, result) => {
        if (err) {
            console.error('Error al establecer descuento:', err);
            return res.status(500).json({
                success: false,
                message: 'Error al establecer el descuento'
            });
        }
        console.log('Descuento establecido correctamente para el producto ID:', id_producto);
        return res.json({
            success: true,
            message: 'Descuento establecido correctamente'
        });
    }
    );
};