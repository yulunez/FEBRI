const e = require("express");

// Aqui crearemos la lógica para manejar los carros de compra
// Usaremos la sesión para almacenar el carro de compra del usuario
exports.agregarAlCarro = (req, res) => {
    const { productoId, cantidad } = req.body;
    if (!productoId || typeof cantidad === 'undefined') {
        return res.status(400).json({ success: false, mensaje: 'productoId y cantidad son requeridos' });
    }
    if (!req.session.carro) {
        req.session.carro = {};
    }
    const pid = String(productoId);
    const qty = Number(cantidad) || 0;
    if (req.session.carro[pid]) {
        req.session.carro[pid] += qty;
    } else {
        req.session.carro[pid] = qty;
    }
    // If quantity is zero or negative after update, remove the product from the cart
    if (req.session.carro[pid] <= 0) {
        delete req.session.carro[pid];
    }
    res.json({ success: true, mensaje: 'Producto agregado al carro', carro: req.session.carro });
};

exports.obtenerCarro = (req, res) => {
    const carro = req.session.carro || {};
    res.json({ carro });
};

exports.eliminarDelCarro = (req, res) => {
    const { productoId } = req.body;
    if (req.session.carro && req.session.carro[productoId]) {
        delete req.session.carro[productoId];
        res.json({ success: true, mensaje: 'Producto eliminado del carro', carro: req.session.carro });
    } else {
        res.status(404).json({ success: false, mensaje: 'Producto no encontrado en el carro' });
    }
};