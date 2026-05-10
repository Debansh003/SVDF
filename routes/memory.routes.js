// ============================================================
// routes/memory.routes.js
// Base path: /api/v1/memory
// ============================================================
const express = require('express');
const router  = express.Router();
const { simulatePaging, simulateSegmentation, getVirtualMemoryInfo } = require('../controllers/memory.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);
router.post('/paging',        simulatePaging);
router.post('/segmentation',  simulateSegmentation);
router.get('/virtual',        getVirtualMemoryInfo);

module.exports = router;
