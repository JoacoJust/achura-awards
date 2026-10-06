const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    nombre: { type: String, default: '' },
    rol: { type: String, enum: ['admin', 'moderador'], default: 'admin' },
    activo: { type: Boolean, default: true },
    ultimo_login: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Admin', AdminSchema);
