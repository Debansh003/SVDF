// ============================================================
// app.js — Express config: middleware + routes
// ============================================================
const express    = require('express');
const cors       = require('cors');
const morgan     = require('morgan');
const path       = require('path');
const dotenv     = require('dotenv');
const compression = require('compression');

dotenv.config();

const app = express();

// ─── MIDDLEWARE ──────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*', credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ─── STATIC FILES ────────────────────────────────────────────
// Serve CSS, JS, images
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js',  express.static(path.join(__dirname, 'public/js')));
app.use(express.static(path.join(__dirname, 'public')));

// ─── API ROUTES ──────────────────────────────────────────────
app.use('/api/v1/auth',       require('./routes/auth.routes'));
app.use('/api/v1/attacks',    require('./routes/attack.routes'));
app.use('/api/v1/monitoring', require('./routes/monitoring.routes'));
app.use('/api/v1/processes',  require('./routes/process.routes'));
app.use('/api/v1/memory',     require('./routes/memory.routes'));
app.use('/api/v1/ipc',        require('./routes/ipc.routes'));
app.use('/api/v1/reports',    require('./routes/report.routes'));
app.use('/api/v1/ai',         require('./routes/ai.routes'));

// ─── HTML PAGE ROUTES ────────────────────────────────────────
const pages = ['login','dashboard','attacks','monitoring','processes','memory','ipc','ai','reports'];
pages.forEach(p => {
  app.get(`/${p}.html`, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', `${p}.html`));
  });
});

// Root → login
app.get('/', (req, res) => res.redirect('/login.html'));

// ─── ERROR HANDLER ───────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// 404
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'Route not found' });
  }
  res.status(404).sendFile(path.join(__dirname, 'public', 'login.html'));
});

module.exports = app;
