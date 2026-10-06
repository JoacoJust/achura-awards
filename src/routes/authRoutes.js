const express = require('express');
const authController = require('../controllers/authController');
const { enviarCodigoLimiter, verificarCodigoLimiter } = require('../middlewares/rateLimits');

const router = express.Router();
router.post('/enviar-codigo', enviarCodigoLimiter, authController.enviarCodigo);
router.post('/verificar-codigo', verificarCodigoLimiter, authController.verificarCodigo);
module.exports = router;
