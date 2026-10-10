const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema(
  {
    nombre: { type: String, default: '' },
    email: { type: String, required: true, unique: true, lowercase: true },
    password_hash: { type: String, default: '' },
    is_admin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Usuario', UsuarioSchema);
