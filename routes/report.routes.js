// ============================================================
// routes/report.routes.js
// Base path: /api/v1/reports
// ============================================================
const express = require('express');
const router  = express.Router();
const { generateReport, getReports, getReportById, deleteReport } = require('../controllers/report.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.use(protect);
router.get('/',              getReports);
router.post('/generate',     generateReport);
router.get('/:id',           getReportById);
router.delete('/:id',        authorize('admin'), deleteReport);

module.exports = router;
