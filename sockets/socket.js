// ============================================================
// sockets/socket.js — Socket.IO event handlers
// ============================================================
const { Server } = require('socket.io');
const os         = require('os');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join rooms
    socket.on('join-room', (room) => {
      socket.join(room);
      socket.emit('system-notification', { message: `Joined room: ${room}`, type: 'info' });
    });

    // Manual stats request
    socket.on('request-system-stats', () => {
      socket.emit('live-system-stats', getSystemStats());
    });

    // Mark alert as read
    socket.on('mark-alert-read', async (alertId) => {
      try {
        const Alert = require('../models/alert.model');
        await Alert.findByIdAndUpdate(alertId, { isRead: true });
        io.emit('alert-read', { alertId });
      } catch (err) { /* ignore */ }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  // Broadcast live stats every 5 seconds
  setInterval(() => {
    if (io) io.emit('live-system-stats', getSystemStats());
  }, 5000);

  return io;
};

function getSystemStats() {
  const totalMem = os.totalmem();
  const freeMem  = os.freemem();
  return {
    cpu:    (Math.random() * 40 + 10).toFixed(1),   // simulated (real requires sampling)
    memory: (((totalMem - freeMem) / totalMem) * 100).toFixed(1),
    uptime: os.uptime(),
    timestamp: new Date().toISOString()
  };
}

const getIO = () => io;

module.exports = { initSocket, getIO };
