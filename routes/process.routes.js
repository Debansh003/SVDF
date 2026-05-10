// ============================================================
// routes/process.routes.js
// Base path: /api/v1/processes
// ============================================================
const express = require('express');
const router  = express.Router();
const { createProcess, getProcesses, clearProcesses, runFCFS, runSJF, runRoundRobin, runPriority } = require('../controllers/process.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);
router.get('/',                    getProcesses);
router.post('/',                   createProcess);
router.delete('/clear',            clearProcesses);
router.post('/schedule/fcfs',      runFCFS);
router.post('/schedule/sjf',       runSJF);
router.post('/schedule/rr',        runRoundRobin);
router.post('/schedule/priority',  runPriority);

module.exports = router;
