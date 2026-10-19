const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/authRoutes');
const votacionRoutes = require('./routes/votacionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const Usuario = require('./models/Usuario');
const Admin = require('./models/Admin');
const jwt = require('jsonwebtoken');
const { notFoundHandler, errorHandler, asyncHandler, unauthorized } = require('./core/errores');
const { globalLimiter } = require('./middlewares/rateLimits');

const app = express();
app.set('trust proxy', 1);
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(globalLimiter);
// Sesión de los 10 usuarios: requiere login explícito
app.use(session({
  secret: process.env.SESSION_SECRET || 'achura-secret-2026',
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: { httpOnly: true, sameSite: 'lax', secure: 'auto' },
}));

// Guard: todo requiere sesión salvo login, panel de admin y media pública.
app.use((req, res, next) => {
  const exentas = ['/login', '/logout', '/api/me', '/api/auth/enviar-codigo', '/api/auth/verificar-codigo'];
  if (exentas.includes(req.path)) return next();
  // El panel de admin tiene su propio login (JWT) y no depende de la sesión de votante
  if (req.path.startsWith('/admin') || req.path === '/AchuraAwards/admin') return next();
  if (req.path.startsWith('/api/admin')) return next(); // admin usa JWT propio
  // Media pública: fotos de ternas, logo y archivos subidos desde el admin
  if (req.path.startsWith('/media/') || req.path.startsWith('/img/') || req.path.startsWith('/uploads/')) return next();
  if (!req.session.userId) {
    if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'Iniciá sesión' });
    return res.redirect('/login');
  }
  next();
});

app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../public/login.html')));
app.post('/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Demasiados intentos' } }), async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '').trim();
  const u = await Usuario.findOne({ email });
  if (!u || !u.password_hash || !bcrypt.compareSync(password, u.password_hash)) {
    return res.status(401).json({ error: 'Email o contraseña incorrectos' });
  }
  req.session.userId = u._id;
  req.session.save(() => {
    res.json({ ok: true, nombre: u.nombre });
  });
});
app.post('/logout', (req, res) => { req.session.destroy(() => {}); res.json({ ok: true }); });
app.get('/api/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'No autenticado' });
  Usuario.findById(req.session.userId).then((u) => res.json({ nombre: u.nombre, email: u.email })).catch(() => res.status(401).json({}));
});

// --- Panel de admin: protegido con contraseña (nadie ve el form sin la clave) ---
const adminHtml = path.join(__dirname, '../public/admin.html');
const adminGateHtml = path.join(__dirname, '../public/admin-gate.html');

async function passwordAdminOk(password) {
  if (!password) return false;
  // 1) clave por env (ADMIN_PASSWORD)
  if (password === (process.env.ADMIN_PASSWORD || 'achura2026')) return true;
  // 2) o la clave real del usuario admin en la DB
  try {
    const email = (process.env.ADMIN_EMAIL || 'admin@achura.com').toLowerCase();
    const admin = await Admin.findOne({ email, activo: true });
    if (admin && admin.password_hash && (await bcrypt.compare(password, admin.password_hash))) return true;
  } catch (e) { /* sin DB seguimos con el chequeo por env */ }
  return false;
}

app.get(['/admin', '/admin/', '/admin.html', '/AchuraAwards/admin'], (req, res) => {
  res.sendFile(req.session.admin_ok ? adminHtml : adminGateHtml);
});

app.post('/admin', rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Demasiados intentos' } }), asyncHandler(async (req, res) => {
  const password = String(req.body.password || '');
  if (!(await passwordAdminOk(password))) throw unauthorized('Contraseña incorrecta');
  req.session.admin_ok = true;
  req.session.save(() => res.json({ ok: true }));
}));

// El panel pide el token por sesión después de pasar la contraseña
app.get('/api/admin/session', asyncHandler(async (req, res) => {
  if (!req.session.admin_ok) throw unauthorized('Ingresá la contraseña de admin');
  const email = (process.env.ADMIN_EMAIL || 'admin@achura.com').toLowerCase();
  const admin = await Admin.findOne({ email, activo: true });
  if (!admin) throw unauthorized('Admin no encontrado');
  const token = jwt.sign({ id: admin._id, email: admin.email, rol: 'admin' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION || '24h' });
  res.json({ success: true, token, admin: { id: admin._id, email: admin.email, nombre: admin.nombre, rol: admin.rol } });
}));

// Logo y assets del panel de admin
app.use('/img', express.static(path.join(__dirname, '../public/img')));

// Serve frontend React (protegido por el guard)
app.use(express.static(path.join(__dirname, '../web/dist')));
// Multimedia subida desde el admin (multer la guarda en public/uploads)
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.get('/AchuraAwards', (req, res) => res.sendFile(path.join(__dirname, '../web/dist/index.html')));

app.use('/api/auth', authRoutes);
app.use('/api', votacionRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
