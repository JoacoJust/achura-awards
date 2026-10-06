const mongoose = require('mongoose');

const OpcionSchema = new mongoose.Schema(
  {
    categoria: { type: mongoose.Schema.Types.ObjectId, ref: 'Categoria', required: true, index: true },
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String, default: '' },
    imagen_url: { type: String, default: null },
    video_url: { type: String, default: null },
    votos: { type: Number, default: 0 },
    posicion: { type: Number, required: true },
  },
  { timestamps: true }
);

OpcionSchema.index({ votos: -1 });

module.exports = mongoose.model('Opcion', OpcionSchema);
