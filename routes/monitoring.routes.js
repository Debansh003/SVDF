// ============================================================
// routes/monitoring.routes.js
// Base path: /api/v1/monitoring
// ============================================================
const express = require('express');
const router  = express.Router();
const { getSystemStats, getAlerts, markAllRead, getDashboardSummary } = require('../controllers/monitoring.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);
router.get('/stats',     getSystemStats);
router.get('/alerts',    getAlerts);
router.get('/dashboard', getDashboardSummary);
router.put('/alerts/read-all', markAllRead);

module.exports = router;
