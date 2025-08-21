const express = require("express");
const path = require("path");
const { sql, conectarBD } = require("./conexion");

const app = express();


// Carpeta pública (donde están tus html, css, js)
app.use(express.static(path.join(__dirname, "public")));

// Ruta principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
