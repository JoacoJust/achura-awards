const rateLimit = require('express-rate-limit');

const enviarCodigoLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Demasiados envíos de código. Probá más tarde.' },
});

const verificarCodigoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: 'Demasiados intentos de verificación. Probá más tarde.' },
});

const globalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 300,
  message: { success: false, error: 'Demasiadas peticiones.' },
});

module.exports = { enviarCodigoLimiter, verificarCodigoLimiter, globalLimiter };
