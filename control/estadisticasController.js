exports.ventasPorMes = (req, res) => {
    const db = req.db;
    // The sale date is stored on detalleventas (d.Fecha_venta), not on venta
    const sql = `SELECT 
                    MONTH(d.Fecha_venta) AS mes,
                    YEAR(d.Fecha_venta) AS anio,
                    SUM(d.Cantidad * p.Precio) AS total_ventas
                FROM venta v
                JOIN detalleventas d ON v.ID_venta = d.VentaID  
                JOIN producto p ON d.ProductoID = p.ID_producto
                GROUP BY YEAR(d.Fecha_venta), MONTH(d.Fecha_venta)
                ORDER BY anio DESC, mes DESC;`; 
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error en consulta ventasPorMes:', err);
            return res.status(500).json({ success: false, message: 'Error en la base de datos' });
        }
        const ventasPorMes = Array.isArray(results) ? results.map(r => ({
            mes: r.mes,
            anio: r.anio,   
            total_ventas: Number(r.total_ventas || 0)
        })) : [];
        res.json({ success: true, ventasPorMes });
    });
}

exports.productoMasVendido = (req, res) => {
    const db = req.db;
    const sql = `SELECT
                    p.ID_producto AS id_producto,
                    p.Nombre AS producto,
                    SUM(d.Cantidad) AS total_vendido    
                FROM detalleventas d
                JOIN producto p ON d.ProductoID = p.ID_producto
                GROUP BY p.ID_producto, p.Nombre
                ORDER BY total_vendido DESC
                LIMIT 1;`;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error en consulta productoMasVendido:', err);
            return res.status(500).json({ success: false, message: 'Error en la base de datos' });
        }
        if (Array.isArray(results) && results.length > 0) {
            const r = results[0];
            const productoMasVendido = {    
                id_producto: r.id_producto,
                producto: r.producto,
                total_vendido: Number(r.total_vendido || 0)
            };
            return res.json({ success: true, productoMasVendido });
        } else {
            return res.json({ success: true, productoMasVendido: null });
        }
    });
}