const Categoria = require('../models/Categoria');
const Opcion = require('../models/Opcion');
const Voto = require('../models/Voto');
const { badRequest, notFound, asyncHandler } = require('../core/errores');

exports.getCategorias = asyncHandler(async (req, res) => {
  const categorias = await Categoria.find({ activa: true }).sort('posicion').lean();
  const opciones = await Opcion.find({ categoria: { $in: categorias.map((c) => c._id) } }).sort('posicion').lean();
  // ¿Qué votó ya este usuario en cada categoría?
  const misVotos = await Voto.find({ usuario: req.usuario.id }).lean();
  const votoPorCategoria = new Map(misVotos.map((v) => [String(v.categoria), String(v.opcion)]));

  const data = categorias.map((c) => ({
    id: c._id,
    nombre: c.nombre,
    descripcion: c.descripcion,
    posicion: c.posicion,
    tipo: c.tipo_media,
    mencion: c.mencion || '',
    permite_votar: c.permite_votar !== false,
    poster_url: c.poster_url || null,
    ya_voto: votoPorCategoria.has(String(c._id)),
    opcion_elegida: votoPorCategoria.get(String(c._id)) || null,
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
  const existe = await Voto.findOne({ usuario: req.usuario.id, categoria: req.params.categoria_id });
  if (existe) return res.json({ puede_votar: false, razon: 'Ya has votado en esta categoría' });
  res.json({ puede_votar: true });
});

exports.votar = asyncHandler(async (req, res) => {
  const { categoria_id, opcion_id } = req.body;
  if (!categoria_id || !opcion_id) throw badRequest('categoria_id y opcion_id son obligatorios');

  const categoria = await Categoria.findOne({ _id: categoria_id, activa: true });
  if (!categoria) throw notFound('Categoría no encontrada o inactiva');
  if (categoria.permite_votar === false) throw badRequest('Esta terna es de presentación, no se vota');
  const opcion = await Opcion.findOne({ _id: opcion_id, categoria: categoria_id });
  if (!opcion) throw notFound('Opción no encontrada en esa categoría');

  const yaVoto = await Voto.findOne({ usuario: req.usuario.id, categoria: categoria_id });
  if (yaVoto) throw badRequest('Ya has votado en esta categoría');

  let voto;
  try {
    voto = await Voto.create({
      usuario: req.usuario.id,
      categoria: categoria_id,
      opcion: opcion_id,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
    });
  } catch (e) {
    // Índice único (usuario + categoria): si dos requests llegan juntas, gana el primero
    if (e && e.code === 11000) throw badRequest('Ya has votado en esta categoría');
    throw e;
  }
  opcion.votos += 1;
  await opcion.save();

  const Usuario = require('../models/Usuario');
  const u = await Usuario.findById(req.usuario.id);
  if (u) {
    u.has_votado = true;
    if (!u.fecha_primer_voto) u.fecha_primer_voto = new Date();
    await u.save();
  }

  res.json({
    success: true,
    message: 'Voto registrado correctamente',
    voto: { id: voto._id, usuario_id: voto.usuario, categoria_id: voto.categoria, opcion_id: voto.opcion, fecha_voto: voto.fecha_voto },
  });
});
