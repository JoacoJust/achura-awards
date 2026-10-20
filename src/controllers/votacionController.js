const mongoose = require('mongoose');
const Categoria = require('../models/Categoria');
const Opcion = require('../models/Opcion');
const Voto = require('../models/Voto');
const { badRequest, notFound, asyncHandler } = require('../core/errores');

// Pesos de los votos dentro de una terna: el 1º vale 2 puntos y el 2º vale 1.
// Cada terna puede definir los suyos (p. ej. "Achura más gobernado" tiene un solo voto: [2]).
const PESOS_POR_DEFECTO = [2, 1];
const pesosDe = (cat) =>
  Array.isArray(cat.pesos_voto) && cat.pesos_voto.length ? cat.pesos_voto : PESOS_POR_DEFECTO;

// Estado de votación del usuario en una categoría (lo usan el front y el endpoint de votar)
function estadoVotos(cat, votos) {
  const pesos = pesosDe(cat);
  const ultimo = votos.length ? votos[votos.length - 1] : null;
  return {
    ya_voto: votos.length > 0,
    opcion_elegida: ultimo ? String(ultimo.opcion) : null,
    opciones_elegidas: votos.map((v) => String(v.opcion)),
    votos_hechos: votos.length,
    votos_permitidos: pesos.length,
    pesos_voto: pesos,
    peso_siguiente: votos.length < pesos.length ? pesos[votos.length] : null,
    completo: votos.length >= pesos.length,
  };
}

const idValido = (id) => mongoose.Types.ObjectId.isValid(String(id || ''));

exports.getCategorias = asyncHandler(async (req, res) => {
  const categorias = await Categoria.find({ activa: true }).sort('posicion').lean();
  const opciones = await Opcion.find({ categoria: { $in: categorias.map((c) => c._id) } }).sort('posicion').lean();
  // ¿Qué votó ya este usuario en cada categoría?
  const misVotos = await Voto.find({ usuario: req.usuario.id }).sort('numero').lean();
  const votosPorCategoria = new Map();
  for (const v of misVotos) {
    const k = String(v.categoria);
    if (!votosPorCategoria.has(k)) votosPorCategoria.set(k, []);
    votosPorCategoria.get(k).push(v);
  }

  const data = categorias.map((c) => ({
    id: c._id,
    nombre: c.nombre,
    descripcion: c.descripcion,
    posicion: c.posicion,
    tipo: c.tipo_media,
    mencion: c.mencion || '',
    permite_votar: c.permite_votar !== false,
    poster_url: c.poster_url || null,
    ...estadoVotos(c, votosPorCategoria.get(String(c._id)) || []),
    opciones: opciones.filter((o) => String(o.categoria) === String(c._id)).map((o) => ({
      id: o._id,
      nombre: o.nombre,
      descripcion: o.descripcion,
      imagen_url: o.imagen_url,
      video_url: o.video_url,
      poster_url: o.poster_url,
      story: o.story || [],
      posicion: o.posicion,
    })),
  }));
  res.json({ success: true, data });
});

exports.puedeVotar = asyncHandler(async (req, res) => {
  if (!idValido(req.params.categoria_id)) throw notFound('Categoría no encontrada');
  const categoria = await Categoria.findById(req.params.categoria_id).lean();
  if (!categoria) throw notFound('Categoría no encontrada');
  const votos = await Voto.find({ usuario: req.usuario.id, categoria: categoria._id }).sort('numero').lean();
  const estado = estadoVotos(categoria, votos);
  if (estado.completo) {
    return res.json({
      puede_votar: false,
      razon: estado.votos_permitidos === 1 ? 'Ya usaste tu voto en esta categoría' : 'Ya usaste tus votos en esta categoría',
      ...estado,
    });
  }
  res.json({ puede_votar: true, ...estado });
});

exports.votar = asyncHandler(async (req, res) => {
  const { categoria_id, opcion_id } = req.body;
  if (!categoria_id || !opcion_id) throw badRequest('categoria_id y opcion_id son obligatorios');

  const categoria = await Categoria.findOne({ _id: categoria_id, activa: true });
  if (!categoria) throw notFound('Categoría no encontrada o inactiva');
  if (categoria.permite_votar === false) throw badRequest('Esta terna es de presentación, no se vota');
  const opcion = await Opcion.findOne({ _id: opcion_id, categoria: categoria_id });
  if (!opcion) throw notFound('Opción no encontrada en esa categoría');

  const pesos = pesosDe(categoria);
  let voto = null;

  for (let intento = 0; intento < 4 && !voto; intento++) {
    const previos = await Voto.find({ usuario: req.usuario.id, categoria: categoria_id }).sort('numero').lean();

    if (previos.length >= pesos.length) {
      throw badRequest(previos.length === 1 ? 'Ya usaste tu voto en esta terna' : 'Ya usaste tus votos en esta terna');
    }
    // El segundo voto no puede ser para el mismo candidato que el primero
    if (previos.some((v) => String(v.opcion) === String(opcion_id))) {
      throw badRequest('Tu segundo voto tiene que ser para otro candidato');
    }

    const numero = previos.length + 1;
    try {
      voto = await Voto.create({
        usuario: req.usuario.id,
        categoria: categoria_id,
        opcion: opcion_id,
        numero,
        peso: pesos[numero - 1],
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
      });
    } catch (e) {
      // Índice único (usuario + categoria + número): si dos requests llegan juntas, reintentamos
      if (e && e.code === 11000) continue;
      throw e;
    }
  }
  if (!voto) throw badRequest('No se pudo registrar el voto, probá de nuevo');

  opcion.votos += voto.peso;
  await opcion.save();

  const Usuario = require('../models/Usuario');
  const u = await Usuario.findById(req.usuario.id);
  if (u) {
    u.has_votado = true;
    if (!u.fecha_primer_voto) u.fecha_primer_voto = new Date();
    await u.save();
  }

  const votosActuales = await Voto.find({ usuario: req.usuario.id, categoria: categoria_id }).sort('numero').lean();

  res.json({
    success: true,
    message: 'Voto registrado correctamente',
    peso: voto.peso,
    numero: voto.numero,
    estado: estadoVotos(categoria, votosActuales),
    voto: {
      id: voto._id,
      usuario_id: voto.usuario,
      categoria_id: voto.categoria,
      opcion_id: voto.opcion,
      numero: voto.numero,
      peso: voto.peso,
      fecha_voto: voto.fecha_voto,
    },
  });
});
