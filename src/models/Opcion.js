const mongoose = require('mongoose');

const OpcionSchema = new mongoose.Schema(
  {
    id_web: { type: String, default: null },
    categoria: { type: mongoose.Schema.Types.ObjectId, ref: 'Categoria', required: true, index: true },
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String, default: '' },
    imagen_url: { type: String, default: null },
    video_url: { type: String, default: null },
    poster_url: { type: String, default: null },
    // story: bloques de texto para las categorías tipo "story"
    story: { type: [{ tipo: { type: String, default: 'texto' }, contenido: { type: String, default: '' } }], default: [] },
    votos: { type: Number, default: 0 },
    posicion: { type: Number, required: true },
  },
  { timestamps: true }
);

OpcionSchema.index({ votos: -1 });

module.exports = mongoose.model('Opcion', OpcionSchema);
