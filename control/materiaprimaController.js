exports.MostrarMateriaPrima = (req, res) => {
    const db = req.db;
    const sql = `SELECT
                 mp.ID_materiales AS ID_materiales,
                 mp.Nombre AS Nombre,
                 mp.Descripcion AS Descripcion,
                 mp.ID_proveedor AS ID_proveedor,
                 mp.ID_inv AS ID_inv,
                 i.Cantidad AS Cantidad,
                 i.Precio AS Precio,
                 pr.Nombre AS Proveedor_nombre,
                 pr.Telefono AS Proveedor_telefono
                FROM materiaprima mp
                LEFT JOIN inventario i ON mp.ID_inv = i.ID_inv
                LEFT JOIN proveedores pr ON mp.ID_proveedor = pr.ID_proveedor
                ORDER BY mp.ID_materiales DESC`;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error al obtener materia prima:', err);
            return res.status(500).json({ success: false, message: 'Error en la base de datos' });
        }
        return res.json({ success: true, materiaPrima: results });
    });
};

// Obtener una materia prima por ID
exports.MostrarMateriaPrimaById = (req, res) => {
    const db = req.db;
    const id = req.params.id;
    if (!id) return res.status(400).json({ success: false, message: 'ID requerido' });

    const sql = `SELECT
                 mp.ID_materiales AS ID_materiales,
                 mp.Nombre AS Nombre,
                 mp.Descripcion AS Descripcion,
                 mp.ID_proveedor AS ID_proveedor,
                 mp.ID_inv AS ID_inv,
                 i.Cantidad AS Cantidad,
                 i.Precio AS Precio,
                 pr.Nombre AS Proveedor_nombre,
                 pr.Telefono AS Proveedor_telefono
                FROM materiaprima mp
                LEFT JOIN inventario i ON mp.ID_inv = i.ID_inv
                LEFT JOIN proveedores pr ON mp.ID_proveedor = pr.ID_proveedor
                WHERE mp.ID_materiales = ?`;

    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error al obtener materia prima por ID:', err);
            return res.status(500).json({ success: false, message: 'Error en la base de datos' });
        }
        if (!results || results.length === 0) return res.status(404).json({ success: false, message: 'No encontrada' });
        return res.json({ success: true, materiaPrima: results[0] });
    });
};

// Crear nueva materia prima
exports.CrearMateriaPrima = (req, res) => {
    const db = req.db;
    const { nombre, descripcion, id_proveedor, precio, cantidad } = req.body;

    // Validar datos requeridos
    if (!nombre || !id_proveedor || !precio || !cantidad) {
        return res.status(400).json({ 
            success: false, 
            message: 'Faltan datos requeridos (nombre, proveedor, precio, cantidad)' 
        });
    }

    // Ensure precio and cantidad are numbers and positive
    const precioNum = parseFloat(precio);
    const cantidadNum = parseInt(cantidad, 10);
    
    if (isNaN(precioNum) || precioNum <= 0 || isNaN(cantidadNum) || cantidadNum <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Precio y cantidad deben ser números positivos'
        });
    }

    // Start transaction
    db.beginTransaction(err => {
        if (err) {
            console.error('Error al iniciar transacción:', err);
            return res.status(500).json({
                success: false,
                message: 'Error al iniciar la creación'
            });
        }

        // First insert into inventario
        db.query(
            'INSERT INTO inventario (Cantidad, Precio) VALUES (?, ?)',
            [cantidadNum, precioNum],
            (err, inventarioResult) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Error al insertar en inventario:', err);
                        res.status(500).json({
                            success: false,
                            message: 'Error al crear el registro de inventario'
                        });
                    });
                }

                const id_inv = inventarioResult.insertId;

                // Then insert into materiaprima
                db.query(
                    'INSERT INTO materiaprima (Nombre, Descripcion, ID_proveedor, ID_inv) VALUES (?, ?, ?, ?)',
                    [nombre.trim(), descripcion ? descripcion.trim() : null, id_proveedor, id_inv],
                    (err, materiaPrimaResult) => {
                        if (err) {
                            return db.rollback(() => {
                                console.error('Error al insertar materia prima:', err);
                                res.status(500).json({
                                    success: false,
                                    message: 'Error al crear la materia prima'
                                });
                            });
                        }

                        // Commit transaction if both inserts succeeded
                        db.commit(err => {
                            if (err) {
                                return db.rollback(() => {
                                    console.error('Error al confirmar transacción:', err);
                                    res.status(500).json({
                                        success: false,
                                        message: 'Error al finalizar la creación'
                                    });
                                });
                            }

                            res.json({
                                success: true,
                                message: 'Materia prima creada exitosamente',
                                id: materiaPrimaResult.insertId
                            });
                        });
                    }
                );
            }
        );
    });
};

// Actualizar materia prima existente
exports.ActualizarMateriaPrima = (req, res) => {
    const db = req.db;
    const { id } = req.params;
    const { nombre, descripcion, id_proveedor, precio, cantidad } = req.body;

    if (!id || !nombre || !id_proveedor || !precio || !cantidad) {
        return res.status(400).json({ 
            success: false, 
            message: 'Faltan datos requeridos' 
        });
    }

    // Start transaction to ensure atomic update
    db.beginTransaction(err => {
        if (err) {
            console.error('Error al iniciar transacción:', err);
            return res.status(500).json({
                success: false,
                message: 'Error al iniciar la actualización'
            });
        }

        // Get current ID_inv
        db.query(
            'SELECT ID_inv FROM materiaprima WHERE ID_materiales = ? FOR UPDATE',
            [id],
            (err, materiaPrimaResults) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Error al obtener materia prima:', err);
                        res.status(500).json({
                            success: false,
                            message: 'Error al buscar la materia prima'
                        });
                    });
                }

                if (!materiaPrimaResults || materiaPrimaResults.length === 0) {
                    return db.rollback(() => {
                        res.status(404).json({
                            success: false,
                            message: 'Materia prima no encontrada'
                        });
                    });
                }

                const id_inv = materiaPrimaResults[0].ID_inv;

                // Update inventario
                db.query(
                    'UPDATE inventario SET Cantidad = ?, Precio = ? WHERE ID_inv = ?',
                    [cantidad, precio, id_inv],
                    (err) => {
                        if (err) {
                            return db.rollback(() => {
                                console.error('Error al actualizar inventario:', err);
                                res.status(500).json({
                                    success: false,
                                    message: 'Error al actualizar el inventario'
                                });
                            });
                        }

                        // Update materiaprima
                        db.query(
                            'UPDATE materiaprima SET Nombre = ?, Descripcion = ?, ID_proveedor = ? WHERE ID_materiales = ?',
                            [nombre, descripcion || null, id_proveedor, id],
                            (err) => {
                                if (err) {
                                    return db.rollback(() => {
                                        console.error('Error al actualizar materia prima:', err);
                                        res.status(500).json({
                                            success: false,
                                            message: 'Error al actualizar la materia prima'
                                        });
                                    });
                                }

                                // Commit transaction if all updates succeeded
                                db.commit(err => {
                                    if (err) {
                                        return db.rollback(() => {
                                            console.error('Error al confirmar transacción:', err);
                                            res.status(500).json({
                                                success: false,
                                                message: 'Error al finalizar la actualización'
                                            });
                                        });
                                    }

                                    res.json({
                                        success: true,
                                        message: 'Materia prima actualizada exitosamente'
                                    });
                                });
                            }
                        );
                    }
                );
            }
        );
    });
};
