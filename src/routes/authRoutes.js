const express = require('express');
const authController = require('../controllers/authController');
const { enviarCodigoLimiter, verificarCodigoLimiter } = require('../middlewares/rateLimits');

const router = express.Router();
// Requiere sesión de login (la protege el guard de app.js), NO entra por código de email
router.post('/session-token', authController.sessionToken);
router.post('/enviar-codigo', enviarCodigoLimiter, authController.enviarCodigo);
router.post('/verificar-codigo', verificarCodigoLimiter, authController.verificarCodigo);
module.exports = router;
