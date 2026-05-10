// ============================================================
// routes/ipc.routes.js
// Base path: /api/v1/ipc
// ============================================================
const express = require('express');
const router  = express.Router();
const { simulatePipe, simulateSharedMemory, simulateMessageQueue, simulateProducerConsumer, simulateDiningPhilosophers } = require('../controllers/ipc.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);
router.post('/pipe',                  simulatePipe);
router.post('/shared-memory',         simulateSharedMemory);
router.post('/message-queue',         simulateMessageQueue);
router.post('/producer-consumer',     simulateProducerConsumer);
router.post('/dining-philosophers',   simulateDiningPhilosophers);

module.exports = router;
