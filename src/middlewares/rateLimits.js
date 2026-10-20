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
  // Las fotos/videos y los archivos estáticos del front no cuentan: no son peticiones a la API.
  // (Si contaran, una sola visita con varias fotos agotaría el límite de todos los votantes.)
  skip: (req) =>
    /^\/(media|img|uploads|assets)\//.test(req.path) ||
    /\.(jpe?g|png|webp|gif|avif|svg|ico|mp4|webm|mov|css|js|map|woff2?|ttf)$/i.test(req.path),
});

module.exports = { enviarCodigoLimiter, verificarCodigoLimiter, globalLimiter };
