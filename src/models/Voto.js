const mongoose = require('mongoose');

const VotoSchema = new mongoose.Schema(
  {
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    categoria: { type: mongoose.Schema.Types.ObjectId, ref: 'Categoria', required: true },
    opcion: { type: mongoose.Schema.Types.ObjectId, ref: 'Opcion', required: true },
    ip_address: { type: String },
    user_agent: { type: String },
  },
  { timestamps: { createdAt: 'fecha_voto', updatedAt: false } }
);

// Un usuario vota UNA sola vez por categoría
VotoSchema.index({ usuario: 1, categoria: 1 }, { unique: true });

module.exports = mongoose.model('Voto', VotoSchema);
