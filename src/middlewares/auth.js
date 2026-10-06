const jwt = require('jsonwebtoken');
const { unauthorized } = require('../core/errores');

function verificarToken(req, res, next, rolEsperado) {
  const header = req.headers.authorization || '';
  const [tipo, token] = header.split(' ');
  if (tipo !== 'Bearer' || !token) return next(unauthorized('Token requerido'));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (rolEsperado && payload.rol !== rolEsperado) return next(unauthorized('Token no autorizado para esta ruta'));
    req.usuario = payload;
    next();
  } catch {
    next(unauthorized('Token inválido o expirado'));
  }
}

const authVotante = (req, res, next) => verificarToken(req, res, next, 'votante');
const authAdmin = (req, res, next) => verificarToken(req, res, next, 'admin');

module.exports = { authVotante, authAdmin };
