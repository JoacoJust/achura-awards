const nodemailer = require('nodemailer');

let transporter = null;
if (process.env.EMAIL_HOST && process.env.EMAIL_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || 587),
    secure: false,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
}

async function enviarCodigo(email, codigo) {
  if (!transporter) {
    // Modo dev: no hay SMTP configurado, mostramos el código en consola
    console.log(`📧 [DEV] Código para ${email}: ${codigo}`);
    return { modo_dev: true };
  }
  await transporter.sendMail({
    from: `Achura Awards <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Tu código de Achura Awards',
    html: `<h2>¡Hola!</h2><p>Tu código de verificación es:</p><h1 style="letter-spacing:4px">${codigo}</h1><p>Válido por 15 minutos.</p>`,
  });
  return { modo_dev: false };
}

module.exports = { enviarCodigo };
