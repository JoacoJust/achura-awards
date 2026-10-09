const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const adminController = require('../controllers/adminController');
const { authAdmin } = require('../middlewares/auth');

const router = express.Router();

const UPLOADS = path.join(__dirname, '../../public/uploads');
fs.mkdirSync(UPLOADS, { recursive: true });
const storage = multer.diskStorage({
  destination: UPLOADS,
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });

router.post('/login', adminController.login);

router.get('/dashboard', authAdmin, adminController.dashboard);
router.get('/resultados', authAdmin, adminController.resultados);
router.get('/votantes', authAdmin, adminController.votantes);
router.post('/categorias', authAdmin, adminController.crearCategoria);
router.post('/opciones', authAdmin, adminController.crearOpcion);
router.put('/opciones', authAdmin, adminController.actualizarOpcion);
router.put('/categorias/:id/toggle', authAdmin, adminController.toggleCategoria);
router.post('/upload-media', authAdmin, upload.single('file'), adminController.uploadMedia);
router.get('/reporte', authAdmin, adminController.reporte);

module.exports = router;
