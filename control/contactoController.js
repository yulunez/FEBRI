// Controlador para enviar mensajes de contactos via WhatsApp Cloud API
// Requiere: WHATSAPP_TOKEN, WHATSAPP_PHONE_ID, WHATSAPP_DEST en .env

async function enviar(req, res) {
    try {
        const { nombre, email, mensaje } = req.body || {};
        if (!nombre || !email || !mensaje) {
            return res.status(400).json({ success: false, message: "Todos los campos son obligatorios." });
        }

        const host = process.env.SMTP_HOST;
        const port = Number(process.env.SMTP_PORT || 587);
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASS;
        const from = process.env.SMTP_FROM || user;
        const to = process.env.SMTP_TO || user; // Puedes definir SMTP_TO en .env para otro destinatario

        if (!host || !port || !user || !pass) {
            return res.status(500).json({ success: false, message: "Correo no configurado. Verifique SMTP en .env." });
        }

        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465, // true si usas 465, false para 587
            auth: { user, pass }
        });

        const subject = "Nuevo mensaje de contacto - FEBRI";
        const text = `Nombre: ${nombre}\nEmail: ${email}\nMensaje:\n${mensaje}`;
        const html = `<p><strong>Nombre:</strong> ${nombre}</p>
                      <p><strong>Email:</strong> ${email}</p>
                      <p><strong>Mensaje:</strong><br>${mensaje.replace(/\n/g,'<br>')}</p>`;

        try {
            const info = await transporter.sendMail({ from, to, subject, text, html });
            console.log("Correo de contacto enviado:", info.messageId);
            return res.json({ success: true, message: "Mensaje enviado por correo." });
        } catch (err) {
            console.error("Error enviando correo de contacto:", err);
            return res.status(500).json({ success: false, message: "No se pudo enviar el correo." });
        }
        const token = (process.env.WHATSAPP_TOKEN || "").trim();
        const phoneId = (process.env.WHATSAPP_PHONE_ID || "").toString().trim();
        const toNumber = (process.env.WHATSAPP_DEST || "").toString().trim();
        const templateName = (process.env.WHATSAPP_TEMPLATE_NAME || "").trim();
        const templateLang = (process.env.WHATSAPP_TEMPLATE_LANG || "es").trim();

        if (!token || token.length < 20 || /\s/.test(token)) {
            return res.status(500).json({
                success: false,
                message: "Token de WhatsApp inválido o malformado. Revisa WHATSAPP_TOKEN en .env (sin comillas ni espacios)."
            });
        }
        if (!phoneId || !toNumber) {
            return res.status(500).json({
                success: false,
                message: "Faltan WHATSAPP_PHONE_ID o WHATSAPP_DEST en .env."
            });
        }

        const cuerpo = `Nuevo mensaje de contacto:\n\n` +
            `Nombre: ${nombre}\n` +
            `Email: ${email}\n` +
            `Mensaje:\n${mensaje}\n\n` +
            `Enviado desde FEBRI`;

        const url = `https://graph.facebook.com/v21.0/${phoneId}/messages`;

        console.log("WhatsApp enviar -> to:", toNumber, "phoneId:", phoneId, "template:", templateName || "(texto)");

        let payload;
        if (templateName) {
            // Soporte para plantilla de prueba "hello_world" (no requiere parámetros)
            if (templateName.toLowerCase() === "hello_world") {
                payload = {
                    messaging_product: "whatsapp",
                    to: toNumber,
                    type: "template",
                    template: {
                        name: templateName,
                        language: { code: templateLang }
                    }
                };
            } else {
                // Plantilla propia con parámetros en el body
                payload = {
                    messaging_product: "whatsapp",
                    to: toNumber,
                    type: "template",
                    template: {
                        name: templateName,
                        language: { code: templateLang },
                        components: [
                            {
                                type: "body",
                                parameters: [
                                    { type: "text", text: nombre },
                                    { type: "text", text: email },
                                    { type: "text", text: mensaje }
                                ]
                            }
                        ]
                    }
                };
            }
        } else {
            // Texto libre (solo funciona si el usuario inició conversación o dentro de 24h)
            payload = {
                messaging_product: "whatsapp",
                to: toNumber,
                type: "text",
                text: { body: cuerpo }
            };
        }

        const resp = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        let data;
        try { data = await resp.json(); } catch { data = null; }

        if (!resp.ok) {
            console.error("Error WhatsApp API:", data);
            const apiMsg = data?.error?.message || "No se pudo enviar el mensaje por WhatsApp.";
            return res.status(500).json({ success: false, message: apiMsg });
        }

        const messageId = Array.isArray(data?.messages) ? data.messages[0]?.id : undefined;
        console.log("WhatsApp OK, message_id:", messageId);
        return res.json({ success: true, message: "Mensaje enviado por WhatsApp.", id: messageId });
    } catch (err) {
        console.error("Error en enviar contacto:", err);
        return res.status(500).json({ success: false, message: "Error interno al enviar mensaje." });
    }
}

module.exports = { enviar };