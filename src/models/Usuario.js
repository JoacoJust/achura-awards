const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    codigo_verificacion: { type: String },
    codigo_expira: { type: Date },
    codigo_verificado: { type: Boolean, default: false },
    fecha_verificacion: { type: Date },
    has_votado: { type: Boolean, default: false },
    fecha_primer_voto: { type: Date },
    ip_address: { type: String },
    user_agent: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Usuario', UsuarioSchema);
