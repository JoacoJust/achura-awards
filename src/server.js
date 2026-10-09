require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');
const asignarImagenesTernas = require('./migrations/asignar-imagenes-ternas');

const PORT = process.env.PORT || 3002;

connectDB()
  .then(async () => {
    // Ejecutar migración de imágenes en producción
    if (process.env.NODE_ENV === 'production') {
      await asignarImagenesTernas();
    }
    app.listen(PORT, () => console.log(`🏆 Achura Awards API en http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('No se pudo conectar a MongoDB:', err.message);
    process.exit(1);
  });
