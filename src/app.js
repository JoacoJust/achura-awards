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
const { notFoundHandler, errorHandler } = require('./core/errores');
const { globalLimiter } = require('./middlewares/rateLimits');

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(globalLimiter);
app.use(session({
  secret: process.env.SESSION_SECRET || 'achura-secret-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' },
}));

// Guard: todo requiere sesión salvo /login, /logout, /api/admin auth, /uploads estáticos de login
app.use((req, res, next) => {
  const exentas = ['/login', '/logout', '/api/me', '/api/auth/enviar-codigo', '/api/auth/verificar-codigo'];
  if (exentas.includes(req.path)) return next();
  if (req.path.startsWith('/api/admin')) return next(); // admin usa JWT propio
  if (!req.session.userId) {
    if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'Iniciá sesión' });
    return res.redirect('/login');
  }
  next();
});

app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../public/login.html')));
app.post('/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Demasiados intentos' } }), async (req, res) => {
  const email = String(req.body.email || '').toLowerCase();
  const password = String(req.body.password || '');
  const u = await Usuario.findOne({ email });
  if (!u || !bcrypt.compareSync(password, u.password_hash)) {
    return res.status(401).json({ error: 'Email o contraseña incorrectos' });
  }
  req.session.userId = u._id;
  res.json({ ok: true, nombre: u.nombre });
});
app.post('/logout', (req, res) => { req.session.destroy(() => {}); res.json({ ok: true }); });
app.get('/api/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'No autenticado' });
  Usuario.findById(req.session.userId).then((u) => res.json({ nombre: u.nombre, email: u.email })).catch(() => res.status(401).json({}));
});

// Serve frontend React (protegido por el guard)
app.use(express.static(path.join(__dirname, '../web/dist')));
app.get('/AchuraAwards', (req, res) => res.sendFile(path.join(__dirname, '../web/dist/index.html')));
app.use('/admin', express.static(path.join(__dirname, '../public')));
app.get('/AchuraAwards/admin', (req, res) => res.sendFile(path.join(__dirname, '../public/admin.html')));

app.use('/api/auth', authRoutes);
app.use('/api', votacionRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
