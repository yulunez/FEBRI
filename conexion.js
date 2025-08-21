const sql = require("mssql");

// Configuración de la base de datos
const config = {
  user: "DESKTOP-EBG9D96\Nelson",        // ejemplo: sa
  password: "", // tu password de SQL Server
  server: "DESKTOP-EBG9D96\SQLEXPRESS",       // o la IP/hostname del servidor
  database: "FEBRI", // el nombre de tu BD
  options: {
    encrypt: false,           // en local debe ser false
    trustServerCertificate: true
  }
};

async function conectarBD() {
  try {
    const pool = await sql.connect(config);
    console.log("✅ Conectado a SQL Server Express");
    return pool;
  } catch (err) {
    console.error("❌ Error al conectar:", err);
  }
}

module.exports = { sql, conectarBD };