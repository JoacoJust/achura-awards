const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/achura_awards';
  await mongoose.connect(uri);
  console.log('✅ MongoDB conectado');

  // Migración: el índice viejo (usuario + categoria único) impedía el segundo voto.
  // Ahora el único es por (usuario + categoria + número de voto).
  try {
    await mongoose.connection.collection('votos').dropIndex('usuario_1_categoria_1');
    console.log('🔧 Índice viejo de votos eliminado (ahora se permiten 2 votos por terna)');
  } catch (e) {
    // si no existe, no hay nada que hacer
  }
  // Asegura el índice nuevo
  require('../models/Voto');
  await mongoose.model('Voto').syncIndexes().catch(() => {});
}

module.exports = connectDB;
