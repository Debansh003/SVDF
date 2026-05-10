// ============================================================
// controllers/ipc.controller.js — IPC simulations
// ============================================================

// POST /api/v1/ipc/pipe
const simulatePipe = async (req, res) => {
  try {
    const { message = 'Hello from Process A', bufferSize = 1024 } = req.body;
    const bytes = Buffer.byteLength(message, 'utf8');
    const log = [
      `[Writer] Opening write end of pipe...`,
      `[Pipe]   Buffer allocated: ${bufferSize} bytes`,
      `[Writer] Writing: "${message}"`,
      `[Pipe]   ${bytes} bytes transferred`,
      `[Reader] Reading from pipe...`,
      `[Reader] Received: "${message}"`,
      `[Pipe]   Pipe closed successfully`
    ];
    res.json({ success: true, data: {
      message, received: message,
      bytesSent: bytes, bufferSize,
      status: 'SUCCESS', log
    }});
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/ipc/shared-memory
const simulateSharedMemory = async (req, res) => {
  try {
    const { segmentName = 'shm_seg1', size = 4096, data = 'Hello from shared memory!' } = req.body;
    const key = `0x${Math.floor(Math.random()*0xFFFF).toString(16).padStart(4,'0')}`;
    const log = [
      `[SHM] shmget(IPC_PRIVATE, ${size}, 0666|IPC_CREAT) → key=${key}`,
      `[Writer] shmat() — attached to address 0x7f${Math.floor(Math.random()*0xFFFF).toString(16)}`,
      `[Writer] Writing: "${data}"`,
      `[Reader] shmat() — attached same segment`,
      `[Reader] Read: "${data}"`,
      `[SHM] shmdt() — detached`,
      `[SHM] shmctl(IPC_RMID) — segment removed`
    ];
    res.json({ success: true, data: {
      segmentName, key, size,
      written: data, read: data,
      status: 'SUCCESS', log
    }});
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/ipc/message-queue
const simulateMessageQueue = async (req, res) => {
  try {
    const { messageCount = 5, messageType = 1, message = 'Task payload data' } = req.body;
    const qid = Math.floor(Math.random()*99999);
    const messages = Array.from({length: messageCount}, (_, i) => ({
      type: messageType,
      text: `${message} #${i+1}`,
      size: Buffer.byteLength(`${message} #${i+1}`, 'utf8')
    }));
    const log = [
      `[MQ] msgget() → msqid=${qid}`,
      ...messages.map(m => `[Sender] msgsnd(type=${m.type}): "${m.text}" [${m.size}B]`),
      ...messages.map(m => `[Receiver] msgrcv(type=${m.type}): "${m.text}"`),
      `[MQ] msgctl(IPC_RMID) — queue removed`
    ];
    res.json({ success: true, data: {
      queueId: qid, messageCount, messages, status: 'SUCCESS', log
    }});
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/ipc/producer-consumer
const simulateProducerConsumer = async (req, res) => {
  try {
    const { bufferSize = 5, itemCount = 10, delay = 100 } = req.body;
    const buffer = [];
    const log = [];
    let produced = 0, consumed = 0;

    for (let i = 0; i < itemCount; i++) {
      const item = `Item-${i+1}`;
      if (buffer.length < bufferSize) {
        buffer.push(item);
        produced++;
        log.push(`[Producer] Produced ${item} | Buffer: [${buffer.join(', ')}]`);
      } else {
        log.push(`[Producer] Buffer FULL — waiting... (semaphore down)`);
      }

      if (buffer.length > 0 && i % 2 === 0) {
        const consumed_item = buffer.shift();
        consumed++;
        log.push(`[Consumer] Consumed ${consumed_item} | Buffer: [${buffer.join(', ')}]`);
      }
    }

    // Drain remaining
    while (buffer.length > 0) {
      const item = buffer.shift();
      consumed++;
      log.push(`[Consumer] Consumed ${item} | Buffer: [${buffer.join(', ')}]`);
    }

    log.push(`[Done] Produced: ${produced}, Consumed: ${consumed}`);

    res.json({ success: true, data: {
      bufferSize, itemCount, produced, consumed,
      buffer, status: 'SUCCESS', log
    }});
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/ipc/dining-philosophers
const simulateDiningPhilosophers = async (req, res) => {
  try {
    const { philosophers: n = 5, cycles = 3 } = req.body;
    const log = [];
    const states = [];
    let deadlock = false;

    // Simulate using the resource hierarchy solution (no deadlock)
    for (let c = 0; c < cycles; c++) {
      for (let i = 0; i < n; i++) {
        const leftFork  = i;
        const rightFork = (i + 1) % n;
        // Odd philosopher picks right first (deadlock avoidance)
        const [first, second] = i % 2 === 0 ? [leftFork, rightFork] : [rightFork, leftFork];

        log.push(`[Cycle ${c+1}] Philosopher ${i+1}: thinking...`);
        log.push(`[Cycle ${c+1}] Philosopher ${i+1}: picks fork ${first+1}, then fork ${second+1}`);
        log.push(`[Cycle ${c+1}] Philosopher ${i+1}: eating...`);
        log.push(`[Cycle ${c+1}] Philosopher ${i+1}: puts down forks, thinking again`);
      }
    }

    const finalStates = Array.from({length: n}, (_, i) => ({
      id:    i + 1,
      state: ['thinking','eating','thinking'][Math.floor(Math.random()*3)],
      forks: `fork${i+1} & fork${(i+1)%n+1}`
    }));

    finalStates.forEach(p => states.push(p));

    res.json({ success: true, data: {
      philosophers: finalStates,
      cycles, deadlock,
      solution: 'Resource Hierarchy (Asymmetric): even pick left first, odd pick right first',
      status: 'SUCCESS', log
    }});
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { simulatePipe, simulateSharedMemory, simulateMessageQueue, simulateProducerConsumer, simulateDiningPhilosophers };
