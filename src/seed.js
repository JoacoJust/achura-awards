require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const Categoria = require('./models/Categoria');
const Opcion = require('./models/Opcion');
const Admin = require('./models/Admin');

const CATEGORIAS = [
  'Achura del Año', 'Achura Revelación', 'Achura Promesa', 'Achura Deportista del Año',
  'Achura Gamer del Año', 'Mejor Jugador de CS', 'Achura más Gay del Año', 'Achura más Fachero',
  'Achura más Compañero', 'Dupla del Año', 'Clip del Año', 'Tilteo del Año',
  'Mejor Outfit del Año', 'Achura más Bardero', 'Fail del Año', 'Jugador de Fútbol del Año',
  'Secuencia del Año',
];

(async () => {
  await connectDB();

  // Admin
  const email = (process.env.ADMIN_EMAIL || 'admin@achura.com').toLowerCase();
  if (!(await Admin.findOne({ email }))) {
    await Admin.create({
      email,
      password_hash: await bcrypt.hash(process.env.ADMIN_PASSWORD || 'achura2026', 10),
      nombre: 'Admin Achura',
    });
    console.log(`👤 Admin creado: ${email}`);
  }

  // Categorías + opciones placeholder (3 por categoría)
  for (let i = 0; i < CATEGORIAS.length; i++) {
    let cat = await Categoria.findOne({ nombre: CATEGORIAS[i] });
    if (!cat) cat = await Categoria.create({ nombre: CATEGORIAS[i], posicion: i + 1 });
    const count = await Opcion.countDocuments({ categoria: cat._id });
    if (count === 0) {
      await Opcion.insertMany([1, 2, 3].map((n) => ({ categoria: cat._id, nombre: `Candidato ${n}`, posicion: n })));
    }
  }
  console.log('✅ Seed completado: 17 categorías con 3 opciones cada una');
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
