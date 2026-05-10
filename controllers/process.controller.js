// ============================================================
// controllers/process.controller.js — CPU Scheduling Algorithms
// ============================================================
const Process = require('../models/process.model');

// POST /api/v1/processes
const createProcess = async (req, res) => {
  try {
    const { name, arrivalTime, burstTime, priority } = req.body;
    if (!name || !burstTime) return res.status(400).json({ success: false, message: 'name and burstTime required' });

    const pid  = `P-${Date.now().toString(36).toUpperCase()}`;
    const proc = await Process.create({ pid, name, arrivalTime: arrivalTime||0, burstTime, priority: priority||1, createdBy: req.user._id });
    res.status(201).json({ success: true, data: proc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/processes
const getProcesses = async (req, res) => {
  try {
    const processes = await Process.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: processes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/v1/processes/clear
const clearProcesses = async (req, res) => {
  try {
    await Process.deleteMany({ createdBy: req.user._id });
    res.json({ success: true, message: 'All processes cleared' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── FCFS — First Come First Serve ──────────────────────────
const runFCFS = async (req, res) => {
  try {
    let procs = req.body.processes;
    if (!procs?.length) {
      const dbProcs = await Process.find({ createdBy: req.user._id });
      procs = dbProcs.map(p => ({ id: p.pid, name: p.name, arrivalTime: p.arrivalTime, burstTime: p.burstTime }));
    }
    if (!procs?.length) return res.status(400).json({ success: false, message: 'No processes to schedule' });

    // Sort by arrival time
    procs = procs.slice().sort((a, b) => a.arrivalTime - b.arrivalTime);

    let currentTime = 0;
    const schedule = procs.map((p, i) => {
      const start    = Math.max(currentTime, p.arrivalTime);
      const finish   = start + p.burstTime;
      const waiting  = start - p.arrivalTime;
      const turnaround = finish - p.arrivalTime;
      currentTime    = finish;
      return { ...p, startTime: start, finishTime: finish, waitingTime: waiting, turnaroundTime: turnaround };
    });

    const avgWait = (schedule.reduce((a, p) => a + p.waitingTime, 0) / schedule.length).toFixed(2);
    const avgTAT  = (schedule.reduce((a, p) => a + p.turnaroundTime, 0) / schedule.length).toFixed(2);

    res.json({ success: true, data: { algorithm: 'FCFS', schedule, avgWaitingTime: parseFloat(avgWait), avgTurnaroundTime: parseFloat(avgTAT) }});
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── SJF — Shortest Job First (Non-preemptive) ──────────────
const runSJF = async (req, res) => {
  try {
    let procs = req.body.processes;
    if (!procs?.length) {
      const dbProcs = await Process.find({ createdBy: req.user._id });
      procs = dbProcs.map(p => ({ id: p.pid, name: p.name, arrivalTime: p.arrivalTime, burstTime: p.burstTime }));
    }
    if (!procs?.length) return res.status(400).json({ success: false, message: 'No processes to schedule' });

    const remaining = procs.map(p => ({ ...p, done: false }));
    const schedule  = [];
    let currentTime = 0, done = 0;

    while (done < remaining.length) {
      const available = remaining.filter(p => !p.done && p.arrivalTime <= currentTime);
      if (!available.length) { currentTime++; continue; }

      const shortest = available.reduce((min, p) => p.burstTime < min.burstTime ? p : min, available[0]);
      const idx      = remaining.findIndex(p => p.id === shortest.id);

      const start      = currentTime;
      const finish     = start + shortest.burstTime;
      const waiting    = start - shortest.arrivalTime;
      const turnaround = finish - shortest.arrivalTime;

      schedule.push({ ...shortest, startTime: start, finishTime: finish, waitingTime: waiting, turnaroundTime: turnaround });
      remaining[idx].done = true;
      currentTime = finish;
      done++;
    }

    const avgWait = (schedule.reduce((a, p) => a + p.waitingTime, 0) / schedule.length).toFixed(2);
    const avgTAT  = (schedule.reduce((a, p) => a + p.turnaroundTime, 0) / schedule.length).toFixed(2);

    res.json({ success: true, data: { algorithm: 'SJF', schedule, avgWaitingTime: parseFloat(avgWait), avgTurnaroundTime: parseFloat(avgTAT) }});
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Round Robin ─────────────────────────────────────────────
const runRoundRobin = async (req, res) => {
  try {
    let procs = req.body.processes;
    const quantum = parseInt(req.query.quantum || req.body.quantum) || 3;
    if (!procs?.length) {
      const dbProcs = await Process.find({ createdBy: req.user._id });
      procs = dbProcs.map(p => ({ id: p.pid, name: p.name, arrivalTime: p.arrivalTime, burstTime: p.burstTime }));
    }
    if (!procs?.length) return res.status(400).json({ success: false, message: 'No processes to schedule' });

    const queue    = procs.map(p => ({ ...p, remaining: p.burstTime, firstRun: -1 })).sort((a,b)=>a.arrivalTime-b.arrivalTime);
    const gantt    = [];
    const results  = {};
    queue.forEach(p => { results[p.id] = { ...p, waitingTime: 0, turnaroundTime: 0 }; });

    let currentTime = 0;
    const readyQueue = [];
    let idx = 0;
    const allProcs = [...queue];

    // Add processes that arrive at time 0
    while (idx < allProcs.length && allProcs[idx].arrivalTime <= currentTime) {
      readyQueue.push(allProcs[idx++]);
    }

    while (readyQueue.length) {
      const proc = readyQueue.shift();
      if (proc.firstRun < 0) proc.firstRun = currentTime;

      const execTime = Math.min(proc.remaining, quantum);
      gantt.push({ id: proc.id, name: proc.name, start: currentTime, end: currentTime + execTime });
      currentTime += execTime;
      proc.remaining -= execTime;

      // Add newly arrived
      while (idx < allProcs.length && allProcs[idx].arrivalTime <= currentTime) {
        readyQueue.push(allProcs[idx++]);
      }

      if (proc.remaining > 0) {
        readyQueue.push(proc);
      } else {
        results[proc.id].finishTime   = currentTime;
        results[proc.id].turnaroundTime = currentTime - proc.arrivalTime;
        results[proc.id].waitingTime  = results[proc.id].turnaroundTime - proc.burstTime;
      }
    }

    const schedule  = Object.values(results);
    const avgWait   = (schedule.reduce((a, p) => a + (p.waitingTime||0), 0) / schedule.length).toFixed(2);
    const avgTAT    = (schedule.reduce((a, p) => a + (p.turnaroundTime||0), 0) / schedule.length).toFixed(2);

    res.json({ success: true, data: { algorithm: 'Round Robin', quantum, schedule, gantt, avgWaitingTime: parseFloat(avgWait), avgTurnaroundTime: parseFloat(avgTAT) }});
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Priority Scheduling (Non-preemptive) ────────────────────
const runPriority = async (req, res) => {
  try {
    let procs = req.body.processes;
    if (!procs?.length) {
      const dbProcs = await Process.find({ createdBy: req.user._id });
      procs = dbProcs.map(p => ({ id: p.pid, name: p.name, arrivalTime: p.arrivalTime, burstTime: p.burstTime, priority: p.priority }));
    }
    if (!procs?.length) return res.status(400).json({ success: false, message: 'No processes to schedule' });

    const remaining = procs.map(p => ({ ...p, done: false }));
    const schedule  = [];
    let currentTime = 0, done = 0;

    while (done < remaining.length) {
      const available = remaining.filter(p => !p.done && p.arrivalTime <= currentTime);
      if (!available.length) { currentTime++; continue; }

      // Lower priority number = higher priority
      const highest = available.reduce((h, p) => (p.priority||1) < (h.priority||1) ? p : h, available[0]);
      const idx     = remaining.findIndex(p => p.id === highest.id);

      const start      = currentTime;
      const finish     = start + highest.burstTime;
      const waiting    = start - highest.arrivalTime;
      const turnaround = finish - highest.arrivalTime;

      schedule.push({ ...highest, startTime: start, finishTime: finish, waitingTime: waiting, turnaroundTime: turnaround });
      remaining[idx].done = true;
      currentTime = finish;
      done++;
    }

    const avgWait = (schedule.reduce((a, p) => a + p.waitingTime, 0) / schedule.length).toFixed(2);
    const avgTAT  = (schedule.reduce((a, p) => a + p.turnaroundTime, 0) / schedule.length).toFixed(2);

    res.json({ success: true, data: { algorithm: 'Priority', schedule, avgWaitingTime: parseFloat(avgWait), avgTurnaroundTime: parseFloat(avgTAT) }});
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createProcess, getProcesses, clearProcesses, runFCFS, runSJF, runRoundRobin, runPriority };
