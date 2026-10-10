const mongoose = require('mongoose');

const CategoriaSchema = new mongoose.Schema(
  {
    // id_web: identificador estable que trae categories.json del frontend (para poder re-sincronizar)
    id_web: { type: String, default: null, index: true },
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String, default: '' },
    tipo_media: { type: String, enum: ['video', 'imagen', 'story', 'ambos'], default: 'ambos' },
    mencion: { type: String, default: '' },
    activa: { type: Boolean, default: true },
    posicion: { type: Number, required: true },
  },
  { timestamps: true }
);

CategoriaSchema.index({ posicion: 1 });

CategoriaSchema.pre('deleteOne', { document: true, query: false }, async function () {
  const Opcion = mongoose.model('Opcion');
  const Voto = mongoose.model('Voto');
  await Voto.deleteMany({ categoria: this._id });
  await Opcion.deleteMany({ categoria: this._id });
});

module.exports = mongoose.model('Categoria', CategoriaSchema);
