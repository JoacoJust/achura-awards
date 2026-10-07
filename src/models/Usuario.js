const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password_hash: { type: String, required: true },
    is_admin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Usuario', UsuarioSchema);
