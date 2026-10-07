require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');
const Usuario = require('./models/Usuario');
const bcrypt = require('bcryptjs');

const PORT = process.env.PORT || 3002;

const USUARIOS = [
  ['Nicolas', 'Tiscornia', 'NicolasTiscornia@AchuraAwards.com', 'NicolasPaz'],
  ['Jesus', 'Quiero', 'JesusQuiero@AchuraAwards.com', 'Ajax'],
  ['Guido', 'Olmo', 'GuidoOlmo@AchuraAwards.com', 'ComoFc'],
  ['Juan Martin', 'Leyes', 'MartoLeyes@AchuraAwards.com', 'AlumniFc'],
  ['Ramiro', 'Dominguez', 'RamiroDominguez@AchuraAwards.com', 'Termo'],
  ['Mateo', 'Guagliardi', 'MateoGuagliardi@AchuraAwards.com', 'Gayliardi'],
  ['Franco', 'Da Ressurreicao', 'FranDarre@AchuraAwards.com', 'Independiente'],
  ['Joaquin', 'Just', 'JoaquinJust@AchuraAwards.com', 'Argentina'],
  ['Pablo Agustin', 'Damino', 'PabloDamino@AchuraAwards.com', 'Positron'],
  ['Franco', 'Bernardi', 'FrancoBernardi@AchuraAwards.com', 'Zurdo7'],
];

async function seedUsuarios() {
  const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').toLowerCase();
  for (const [nombre, apellido, email, password] of USUARIOS) {
    const hash = bcrypt.hashSync(password, 10);
    await Usuario.updateOne({ email: email.toLowerCase() }, { $set: { nombre: apellido ? nombre + ' ' + apellido : nombre, email: email.toLowerCase(), password_hash: hash, is_admin: email.toLowerCase() === ADMIN_EMAIL } }, { upsert: true });
  }
  console.log('✅ Usuarios de login sincronizados');
}

connectDB()
  .then(seedUsuarios)
  .then(() => app.listen(PORT, () => console.log(`🏆 Achura Awards API en http://localhost:${PORT}`)))
  .catch((err) => {
    console.error('No se pudo conectar a MongoDB:', err.message);
    process.exit(1);
  });
