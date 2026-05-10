// ============================================================
// controllers/memory.controller.js — Paging, Segmentation, Virtual
// ============================================================
const os = require('os');

// ── FIFO Page Replacement ───────────────────────────────────
function fifo(pages, numFrames) {
  const frames = [], trace = [];
  let pageFaults = 0, pageHits = 0, pointer = 0;

  for (const page of pages) {
    const inFrames = frames.includes(page);
    if (inFrames) {
      pageHits++;
      trace.push({ page, frames: [...frames], fault: false });
    } else {
      pageFaults++;
      if (frames.length < numFrames) frames.push(page);
      else { frames[pointer] = page; pointer = (pointer + 1) % numFrames; }
      trace.push({ page, frames: [...frames], fault: true });
    }
  }
  return { pageFaults, pageHits, trace };
}

// ── LRU Page Replacement ────────────────────────────────────
function lru(pages, numFrames) {
  const frames = [], trace = [];
  let pageFaults = 0, pageHits = 0;

  for (const page of pages) {
    const idx = frames.indexOf(page);
    if (idx !== -1) {
      pageHits++;
      frames.splice(idx, 1); frames.push(page);
      trace.push({ page, frames: [...frames], fault: false });
    } else {
      pageFaults++;
      if (frames.length >= numFrames) frames.shift();
      frames.push(page);
      trace.push({ page, frames: [...frames], fault: true });
    }
  }
  return { pageFaults, pageHits, trace };
}

// ── Optimal Page Replacement ────────────────────────────────
function optimal(pages, numFrames) {
  const frames = [], trace = [];
  let pageFaults = 0, pageHits = 0;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    if (frames.includes(page)) {
      pageHits++;
      trace.push({ page, frames: [...frames], fault: false });
    } else {
      pageFaults++;
      if (frames.length < numFrames) {
        frames.push(page);
      } else {
        // Find page used farthest in future
        const future = frames.map(f => {
          const next = pages.indexOf(f, i + 1);
          return next === -1 ? Infinity : next;
        });
        const replaceIdx = future.indexOf(Math.max(...future));
        frames[replaceIdx] = page;
      }
      trace.push({ page, frames: [...frames], fault: true });
    }
  }
  return { pageFaults, pageHits, trace };
}

// POST /api/v1/memory/paging
const simulatePaging = async (req, res) => {
  try {
    const { frames: numFrames = 3, pages, algorithm = 'FIFO' } = req.body;
    if (!pages?.length) return res.status(400).json({ success: false, message: 'pages array required' });

    let result;
    const algo = algorithm.toUpperCase();
    if      (algo === 'FIFO')    result = fifo(pages, numFrames);
    else if (algo === 'LRU')     result = lru(pages, numFrames);
    else if (algo === 'OPTIMAL') result = optimal(pages, numFrames);
    else return res.status(400).json({ success: false, message: 'Unknown algorithm. Use FIFO, LRU, or optimal' });

    const total    = result.pageFaults + result.pageHits;
    const hitRatio = total > 0 ? result.pageHits / total : 0;

    res.json({ success: true, data: {
      algorithm,
      numFrames,
      totalReferences: total,
      pageFaults:  result.pageFaults,
      pageHits:    result.pageHits,
      hitRatio:    parseFloat(hitRatio.toFixed(4)),
      faultRatio:  parseFloat((1 - hitRatio).toFixed(4)),
      trace:       result.trace
    }});
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/memory/segmentation
const simulateSegmentation = async (req, res) => {
  try {
    const { totalMemory = 512, segments = [] } = req.body;
    if (!segments.length) return res.status(400).json({ success: false, message: 'segments array required' });

    const colors = ['#00d4ff','#00ff88','#ffc820','#ff3355','#9966ff','#ff8800'];
    let baseAddress = 0;
    const result = segments.map((seg, i) => {
      const entry = {
        name:    seg.name,
        base:    baseAddress,
        limit:   seg.limit || seg.size || 50,
        end:     baseAddress + (seg.limit || seg.size || 50) - 1,
        color:   colors[i % colors.length],
        status:  'Allocated'
      };
      baseAddress += entry.limit;
      return entry;
    });

    const usedMemory  = segments.reduce((s, seg) => s + (seg.limit || seg.size || 50), 0);
    const freeMemory  = totalMemory - usedMemory;
    const fragmentation = freeMemory > 0 ? ((freeMemory / totalMemory) * 100).toFixed(1) : 0;

    res.json({ success: true, data: {
      totalMemory,
      usedMemory,
      freeMemory,
      fragmentation: parseFloat(fragmentation),
      segments: result
    }});
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/memory/virtual
const getVirtualMemoryInfo = async (req, res) => {
  try {
    const totalMem = os.totalmem();
    const freeMem  = os.freemem();
    const usedMem  = totalMem - freeMem;

    const fmt = (bytes) => {
      const gb = bytes / (1024**3);
      return gb >= 1 ? gb.toFixed(2) + ' GB' : (bytes / (1024**2)).toFixed(0) + ' MB';
    };

    res.json({ success: true, data: {
      totalMemory:   fmt(totalMem),
      usedMemory:    fmt(usedMem),
      freeMemory:    fmt(freeMem),
      virtualMemory: fmt(totalMem * 2),  // simulated VM = 2× physical
      swapUsed:      fmt(totalMem * 0.1),
      swapTotal:     fmt(totalMem * 0.5),
      memoryUsagePercent: ((usedMem / totalMem) * 100).toFixed(1),
      pageSize:      '4 KB',
      totalPages:    Math.floor(totalMem / 4096)
    }});
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { simulatePaging, simulateSegmentation, getVirtualMemoryInfo };
