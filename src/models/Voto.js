const mongoose = require('mongoose');

const VotoSchema = new mongoose.Schema(
  {
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    categoria: { type: mongoose.Schema.Types.ObjectId, ref: 'Categoria', required: true },
    opcion: { type: mongoose.Schema.Types.ObjectId, ref: 'Opcion', required: true },
    // número de voto dentro de la terna: 1 = primer voto, 2 = segundo voto
    numero: { type: Number, default: 1 },
    // cuántos puntos suma este voto al contador de la opción (1º = 2, 2º = 1)
    peso: { type: Number, default: 1 },
    ip_address: { type: String },
    user_agent: { type: String },
  },
  { timestamps: { createdAt: 'fecha_voto', updatedAt: false } }
);

// El usuario puede votar hasta 2 veces por categoría: una por cada número de voto
VotoSchema.index({ usuario: 1, categoria: 1, numero: 1 }, { unique: true });

module.exports = mongoose.model('Voto', VotoSchema);
