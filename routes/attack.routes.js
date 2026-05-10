// ============================================================
// routes/attack.routes.js - Attack Simulation Routes
// ============================================================
// Base path: /api/v1/attacks
// All simulation routes are protected (require login)
// ============================================================

const express = require('express');
const router  = express.Router();

const {
  simulateBufferOverflow,
  simulateTrapdoor,
  simulateBackdoor,
  simulateCachePoisoning,
  simulateMalware,
  simulateDeadlock,
  simulateCPUStarvation,
  simulateUnauthorizedAccess,
  simulateSuspiciousIPC,
  simulateMemoryAbuse,
  getAttackLogs,
  getAttackById,
  getAttackStats
} = require('../controllers/attack.controller');

const { protect } = require('../middlewares/auth.middleware');

// ---- Protect all attack routes ----
router.use(protect);

// ---- Attack Simulation Routes ----
router.post('/simulate/buffer-overflow',       simulateBufferOverflow);
router.post('/simulate/trapdoor',              simulateTrapdoor);
router.post('/simulate/backdoor',              simulateBackdoor);
router.post('/simulate/cache-poisoning',       simulateCachePoisoning);
router.post('/simulate/malware',               simulateMalware);
router.post('/simulate/deadlock',              simulateDeadlock);
router.post('/simulate/cpu-starvation',        simulateCPUStarvation);
router.post('/simulate/unauthorized-access',   simulateUnauthorizedAccess);
router.post('/simulate/suspicious-ipc',        simulateSuspiciousIPC);
router.post('/simulate/memory-abuse',          simulateMemoryAbuse);

// ---- Attack Log Routes ----
router.get('/',           getAttackLogs);   // GET /api/v1/attacks?page=1&limit=20
router.get('/stats',      getAttackStats);  // GET /api/v1/attacks/stats
router.get('/:id',        getAttackById);   // GET /api/v1/attacks/:id

module.exports = router;
