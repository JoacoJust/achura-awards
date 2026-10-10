const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const { enviarCodigo } = require('../core/email');
const { badRequest, unauthorized, asyncHandler } = require('../core/errores');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Intercambia la sesión de login (email + contraseña) por un JWT de votante.
// Así el frontend React vota contra la API sin repetir el código por email.
exports.sessionToken = asyncHandler(async (req, res) => {
  const u = await Usuario.findById(req.session.userId);
  if (!u) throw unauthorized('Sesión inválida, iniciá sesión de nuevo');

  const token = jwt.sign({ id: u._id, email: u.email, nombre: u.nombre, rol: 'votante' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRATION || '24h',
  });
  res.json({ success: true, token, usuario: { id: u._id, nombre: u.nombre, email: u.email } });
});

exports.enviarCodigo = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email || !EMAIL_REGEX.test(email)) throw badRequest('Email inválido');

  const codigo = String(Math.floor(100000 + Math.random() * 900000));
  const expira = new Date(Date.now() + 15 * 60 * 1000);

  let usuario = await Usuario.findOne({ email: email.toLowerCase() });
  if (!usuario) usuario = new Usuario({ email: email.toLowerCase() });
  usuario.codigo_verificacion = codigo;
  usuario.codigo_expira = expira;
  usuario.codigo_verificado = false;
  usuario.ip_address = req.ip;
  usuario.user_agent = req.get('user-agent');
  await usuario.save();

  const { modo_dev } = await enviarCodigo(email, codigo);
  const resp = { success: true, message: 'Código enviado a tu email', codigo_enviado: true };
  if (modo_dev) resp.codigo_dev = codigo; // solo para desarrollo sin SMTP
  res.json(resp);
});

exports.verificarCodigo = asyncHandler(async (req, res) => {
  const { email, codigo } = req.body;
  if (!email || !codigo) throw badRequest('Email y código son obligatorios');

  const usuario = await Usuario.findOne({ email: email.toLowerCase() });
  if (!usuario || usuario.codigo_verificacion !== String(codigo)) {
    throw badRequest('Código incorrecto o expirado');
  }
  if (usuario.codigo_expira < new Date()) throw badRequest('Código expirado');

  usuario.codigo_verificado = true;
  usuario.fecha_verificacion = new Date();
  await usuario.save();

  const token = jwt.sign({ id: usuario._id, email: usuario.email, rol: 'votante' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRATION || '24h',
  });
  res.json({ success: true, token, usuario_id: usuario._id, message: 'Email verificado' });
});
