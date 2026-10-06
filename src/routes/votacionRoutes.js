const express = require('express');
const votacionController = require('../controllers/votacionController');
const { authVotante } = require('../middlewares/auth');

const router = express.Router();
router.get('/categorias', authVotante, votacionController.getCategorias);
router.get('/puede-votar/:categoria_id', authVotante, votacionController.puedeVotar);
router.post('/votar', authVotante, votacionController.votar);
module.exports = router;
