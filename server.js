// ============================================================
// server.js — Entry point: HTTP + Socket.IO server
// Vercel-compatible: exports app for serverless, also runs
// standalone when called directly (local / Render / Railway)
// ============================================================
const http           = require('http');
const app            = require('./app');
const { initSocket } = require('./sockets/socket');
const mongoose       = require('mongoose');
const dotenv         = require('dotenv');

dotenv.config();

const PORT      = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/os_security_db';

// ── Mongoose connection (cached for serverless) ──────────────
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });
  isConnected = true;
  console.log('✅ MongoDB connected');
};

// ── For Vercel serverless export ─────────────────────────────
if (process.env.VERCEL) {
  module.exports = async (req, res) => {
    await connectDB();
    return app(req, res);
  };
} else {
  // ── Local / traditional server ───────────────────────────
  const server = http.createServer(app);
  initSocket(server);

  connectDB()
    .then(() => {
      server.listen(PORT, () => {
        console.log(`🚀 Server running at http://localhost:${PORT}`);
        console.log(`🛡  OS Security Framework — ${process.env.NODE_ENV || 'development'} mode`);
      });
    })
    .catch(err => {
      console.error('Failed to start server:', err.message);
      process.exit(1);
    });

  process.on('SIGINT', async () => {
    await mongoose.disconnect();
    server.close(() => { console.log('Server closed gracefully'); process.exit(0); });
  });
}
