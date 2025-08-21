const { driver } = require("mssql/lib/base");
const sql = require("mssql/msnodesqlv8");

const config = {
  user: "juand",        // tu usuario de SQL Server
  password: "",         // tu password
  server: "localhost",  // o 127.0.0.1
  database: "FEBRI",
  options: {
    trustedConnection: true,
    enableArithAbort: true,
    trustServerCertificate: true
  },
  driver:"msnodesqlv8"
};


async function conectarBD() {
  try {
    const pool = await sql.connect(config);
    console.log("Conectado a SQL Server Express");
    return pool;
  } catch (err) {
    console.error("Error al conectar:", err);
  }
}

module.exports = { sql, conectarBD };