const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Categoria = require('../models/Categoria');
const Opcion = require('../models/Opcion');
const Voto = require('../models/Voto');
const Usuario = require('../models/Usuario');
const { badRequest, unauthorized, notFound, asyncHandler } = require('../core/errores');

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw badRequest('Email y contraseña son obligatorios');

  const admin = await Admin.findOne({ email: email.toLowerCase(), activo: true });
  if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
    throw unauthorized('Email o contraseña incorrectos');
  }
  admin.ultimo_login = new Date();
  await admin.save();

  const token = jwt.sign({ id: admin._id, email: admin.email, rol: 'admin' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRATION || '24h',
  });
  res.json({ success: true, token, admin: { id: admin._id, email: admin.email, nombre: admin.nombre, rol: admin.rol } });
});

exports.dashboard = asyncHandler(async (req, res) => {
  const [total_votos, votantes, categorias_activas] = await Promise.all([
    Voto.countDocuments(),
    Voto.distinct('usuario'),
    Categoria.countDocuments({ activa: true }),
  ]);
  const total_votantes = votantes.length;
  res.json({ success: true, data: { total_votos, total_votantes, categorias_activas, ultima_actualizacion: new Date() } });
});

exports.resultados = asyncHandler(async (req, res) => {
  const categorias = await Categoria.find().sort('posicion').lean();
  const opciones = await Opcion.find({ categoria: { $in: categorias.map((c) => c._id) } }).sort('posicion').lean();

  const data = categorias.map((c) => {
    const opts = opciones.filter((o) => String(o.categoria) === String(c._id));
    const total = opts.reduce((s, o) => s + o.votos, 0);
    return {
      categoria_id: c._id,
      categoria_nombre: c.nombre,
      activa: c.activa,
      total_votos: total,
      opciones: opts.map((o) => ({
        opcion_id: o._id,
        nombre: o.nombre,
        votos: o.votos,
        porcentaje: total ? Number(((o.votos / total) * 100).toFixed(2)) : 0,
      })),
    };
  });
  res.json({ success: true, data });
});

exports.votantes = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '50')));
  // Por defecto sólo quienes ya votaron; ?todos=1 lista a todos los usuarios
  const filtro = req.query.todos === '1' ? {} : { has_votado: true };
  const [usuarios, total] = await Promise.all([
    Usuario.find(filtro).sort('-has_votado -createdAt').skip((page - 1) * limit).limit(limit).lean(),
    Usuario.countDocuments(filtro),
  ]);

  const votos = await Voto.find({ usuario: { $in: usuarios.map((u) => u._id) } })
    .populate('categoria', 'nombre')
    .populate('opcion', 'nombre')
    .sort('fecha_voto')
    .lean();

  const porUsuario = new Map();
  for (const v of votos) {
    const key = String(v.usuario);
    if (!porUsuario.has(key)) porUsuario.set(key, []);
    porUsuario.get(key).push({
      categoria: v.categoria ? v.categoria.nombre : null,
      opcion: v.opcion ? v.opcion.nombre : null,
      numero: v.numero || 1,
      peso: v.peso || 1,
      fecha: v.fecha_voto,
      ip: v.ip_address || null,
    });
  }

  const data = usuarios.map((u) => {
    const propios = porUsuario.get(String(u._id)) || [];
    return {
      id: u._id,
      nombre: u.nombre,
      email: u.email,
      fecha_primer_voto: u.fecha_primer_voto,
      total_votos: propios.length,
      total_puntos: propios.reduce((s, v) => s + (v.peso || 1), 0),
      ultimo_voto: propios.length ? propios[propios.length - 1].fecha : null,
      votos: propios,
    };
  });

  res.json({ success: true, data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

exports.crearCategoria = asyncHandler(async (req, res) => {
  const { nombre, descripcion, tipo_media, posicion } = req.body;
  if (!nombre || posicion === undefined) throw badRequest('nombre y posicion son obligatorios');
  const cat = await Categoria.create({ nombre, descripcion, tipo_media, posicion });
  res.status(201).json({ success: true, data: cat });
});

exports.crearOpcion = asyncHandler(async (req, res) => {
  const { categoria_id, nombre, descripcion, posicion } = req.body;
  if (!categoria_id || !nombre || posicion === undefined) throw badRequest('categoria_id, nombre y posicion son obligatorios');
  const cat = await Categoria.findById(categoria_id);
  if (!cat) throw notFound('Categoría no encontrada');
  const op = await Opcion.create({ categoria: categoria_id, nombre, descripcion, posicion });
  res.status(201).json({ success: true, data: op });
});

exports.toggleCategoria = asyncHandler(async (req, res) => {
  const { activa } = req.body;
  if (typeof activa !== 'boolean') throw badRequest('"activa" debe ser booleano');
  const cat = await Categoria.findByIdAndUpdate(req.params.id, { activa }, { new: true });
  if (!cat) throw notFound('Categoría no encontrada');
  res.json({ success: true, data: { id: cat._id, nombre: cat.nombre, activa: cat.activa } });
});

exports.uploadMedia = asyncHandler(async (req, res) => {
  const { opcion_id, tipo } = req.body;
  if (!req.file) throw badRequest('Archivo requerido (file)');
  if (!['imagen', 'video'].includes(tipo)) throw badRequest('tipo debe ser "imagen" o "video"');
  const opcion = await Opcion.findById(opcion_id);
  if (!opcion) throw notFound('Opción no encontrada');

  const url = `/uploads/${req.file.filename}`;
  if (tipo === 'imagen') opcion.imagen_url = url;
  else opcion.video_url = url;
  await opcion.save();
  res.json({ success: true, data: { url, tipo, size: req.file.size, opcion_id } });
});

exports.reporte = asyncHandler(async (req, res) => {
  const filtro = req.query.categoria_id ? { _id: req.query.categoria_id } : {};
  const categorias = await Categoria.find(filtro).sort('posicion').lean();
  const opciones = await Opcion.find({ categoria: { $in: categorias.map((c) => c._id) } }).sort('posicion').lean();

  let csv = 'categoria,opcion,votos,porcentaje\n';
  categorias.forEach((c) => {
    const opts = opciones.filter((o) => String(o.categoria) === String(c._id));
    const total = opts.reduce((s, o) => s + o.votos, 0);
    opts.forEach((o) => {
      const pct = total ? ((o.votos / total) * 100).toFixed(2) : '0.00';
      csv += `"${c.nombre}","${o.nombre}",${o.votos},${pct}%\n`;
    });
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="achura_reporte.csv"');
  res.send(csv);
});
