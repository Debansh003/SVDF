// ============================================================
// controllers/monitoring.controller.js
// ============================================================
const os        = require('os');
const Alert     = require('../models/alert.model');
const AttackLog = require('../models/attackLog.model');

// GET /api/v1/monitoring/stats
const getSystemStats = async (req, res) => {
  try {
    const cpus   = os.cpus();
    const totalMem  = os.totalmem();
    const freeMem   = os.freemem();
    const usedMem   = totalMem - freeMem;
    const memPercent = ((usedMem / totalMem) * 100).toFixed(1);

    // CPU usage estimation (average idle across all cores)
    const cpuUsage = cpus.map(cpu => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      const idle  = cpu.times.idle;
      return ((1 - idle / total) * 100).toFixed(1);
    });
    const avgCpu = (cpuUsage.reduce((a, b) => a + parseFloat(b), 0) / cpuUsage.length).toFixed(1);

    res.json({ success: true, data: {
      cpu: {
        usage: parseFloat(avgCpu),
        cores: cpus.length,
        model: cpus[0]?.model || 'Unknown'
      },
      memory: {
        total: totalMem,
        free:  freeMem,
        used:  usedMem,
        usedPercent: parseFloat(memPercent)
      },
      uptime: os.uptime(),
      processUptime: process.uptime(),
      loadAvg: os.loadavg(),
      system: {
        platform:    os.platform(),
        arch:        os.arch(),
        nodeVersion: process.version,
        hostname:    os.hostname(),
        freeMem:     freeMem,
        totalMem:    totalMem
      }
    }});
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/monitoring/alerts
const getAlerts = async (req, res) => {
  try {
    const limit  = parseInt(req.query.limit) || 50;
    const unread = req.query.unread === 'true';
    const filter = unread ? { isRead: false } : {};
    const alerts = await Alert.find(filter).sort({ createdAt: -1 }).limit(limit);
    res.json({ success: true, data: alerts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/v1/monitoring/alerts/read-all
const markAllRead = async (req, res) => {
  try {
    await Alert.updateMany({ isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All alerts marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/monitoring/dashboard
const getDashboardSummary = async (req, res) => {
  try {
    const [totalAttacks, unreadAlerts, criticalAlerts] = await Promise.all([
      AttackLog.countDocuments(),
      Alert.countDocuments({ isRead: false }),
      Alert.countDocuments({ severity: 'CRITICAL', isRead: false })
    ]);

    const totalMem   = os.totalmem();
    const freeMem    = os.freemem();
    const usedMemPct = (((totalMem - freeMem) / totalMem) * 100).toFixed(1);

    res.json({ success: true, data: {
      totalAttacks,
      unreadAlerts,
      criticalAlerts,
      alertsCount: unreadAlerts,
      attacksCount: totalAttacks,
      memoryUsage: parseFloat(usedMemPct),
      uptime: os.uptime()
    }});
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getSystemStats, getAlerts, markAllRead, getDashboardSummary };
