const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const votacionRoutes = require('./routes/votacionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { notFoundHandler, errorHandler } = require('./core/errores');
const { globalLimiter } = require('./middlewares/rateLimits');

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(globalLimiter);

// Frontend profesional (React + Vite) ya buildead
app.use(express.static(path.join(__dirname, '../web/dist')));

// Admin clásico (gestión) se mantiene disponible
app.use('/admin', express.static(path.join(__dirname, '../public')));

// URLs amigables: /AchuraAwards sirve el frontend React
app.get('/AchuraAwards', (req, res) => res.sendFile(path.join(__dirname, '../web/dist/index.html')));
app.get('/AchuraAwards/admin', (req, res) => res.sendFile(path.join(__dirname, '../public/admin.html')));

app.use('/api/auth', authRoutes);
app.use('/api', votacionRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
