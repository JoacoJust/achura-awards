// Módulo global de errores: único formato { error: "mensaje" }
class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const badRequest = (m) => new ApiError(400, m);
const unauthorized = (m) => new ApiError(401, m);
const forbidden = (m) => new ApiError(403, m);
const notFound = (m) => new ApiError(404, m);

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const notFoundHandler = (req, res, next) => next(notFound(`Ruta ${req.method} ${req.originalUrl} no encontrada`));

const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) return res.status(err.status).json({ success: false, error: err.message });
  if (err.name === 'ValidationError') {
    const msg = Object.values(err.errors).map((e) => e.message).join('. ');
    return res.status(400).json({ success: false, error: msg });
  }
  if (err.name === 'CastError') return res.status(400).json({ success: false, error: `ID inválido: ${err.value}` });
  if (err.code === 11000) return res.status(400).json({ success: false, error: 'Ya existe un registro con esos datos (duplicado)' });
  console.error(err);
  res.status(500).json({ success: false, error: 'Error interno del servidor' });
};

module.exports = { ApiError, badRequest, unauthorized, forbidden, notFound, asyncHandler, notFoundHandler, errorHandler };
