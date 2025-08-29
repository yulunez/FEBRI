// const express = require("express");
// const path = require("path");
// const { sql, conectarBD } = require("./conexion");

// const app = express();


// // Carpeta pública (donde están tus html, css, js)
// app.use(express.static(path.join(__dirname, "public")));

// // Ruta principal
// app.get("/", (req, res) => {
//   res.sendFile(path.join(__dirname, "public", "index.html"));
// });

// / Iniciar servidor
// const PORT = 3000;
// app.listen(PORT, async () => {
//   console.log(`Servidor corriendo en http://localhost:${PORT}`);

//   // Llamamos a la conexión con la BD
//   await conectarBD();
// });*//*

// // Conectar a la BD antes de iniciar el servidor
// const PORT = 3000;

// (async () => {
//   const pool = await conectarBD();
//   if (pool) {
//     app.listen(PORT, () => {
//       console.log(`Servidor corriendo en http://localhost:${PORT}`);
//     });
//   } else {
//     console.error("No se pudo conectar a la base de datos. El servidor no se inició.");
//   }
// })();

const express = require("express");
const { sql, poolConnect } = require("./conexion");

const app = express();
app.use(express.json());

// Ruta de prueba
app.get("/", async (req, res) => {
  try {
    await poolConnect; // Espera la conexión
    const result = await new sql.Request().query("SELECT GETDATE() as fecha");
    res.json(result.recordset);
  } catch (err) {
    console.error("Error en la consulta:", err);
    res.status(500).send("Error en el servidor");
  }
});

app.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});