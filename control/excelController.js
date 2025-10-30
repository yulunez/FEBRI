const XLSX = require('xlsx');
const pool = require('../db.js');

exports.descargarResultados = async (req, res) => {
  try {
    // Obtener datos de ventas y ganancias mensuales desde la base de datos
    const [rows] = await pool.query(`
      SELECT 
        MONTH(d.Fecha_venta) AS mes,
        YEAR(d.Fecha_venta) AS anio,
        SUM(d.Cantidad * p.Precio) AS total_ventas
      FROM venta v
      JOIN detalleventas d ON v.ID_venta = d.VentaID
      JOIN producto p ON d.ProductoID = p.ID_producto
      GROUP BY YEAR(d.Fecha_venta), MONTH(d.Fecha_venta)
      ORDER BY anio DESC, mes DESC;
    `);

    // Crear libro y hoja de Excel con los datos obtenidos
    const hoja = XLSX.utils.json_to_sheet(rows);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Resultados');

    // Generar buffer (archivo en memoria)
    const buffer = XLSX.write(libro, { bookType: 'xlsx', type: 'buffer' });

    // Configurar cabeceras para descargar
    res.setHeader('Content-Disposition', 'attachment; filename=resultados.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    // Enviar el archivo Excel al cliente
    res.send(buffer);

  } catch (error) {
    console.error('Error al generar Excel:', error);
    res.status(500).json({ error: 'No se pudo generar el archivo Excel' });
  }
};
