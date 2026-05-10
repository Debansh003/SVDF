// ============================================================
// routes/ai.routes.js
// Base path: /api/v1/ai
// ============================================================
const express = require('express');
const router  = express.Router();
const { getPreventionTips, analyzeAttackPattern, getStaticTips } = require('../controllers/ai.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);
router.post('/prevention',     getPreventionTips);
router.post('/analyze',        analyzeAttackPattern);
router.get('/tips/:attackType', getStaticTips);

module.exports = router;
