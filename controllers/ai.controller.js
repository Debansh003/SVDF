// ============================================================
// controllers/ai.controller.js — AI Prevention Tips
// ============================================================

// Static fallback tips by attack type
const STATIC_TIPS = {
  'buffer-overflow': {
    tips: [
      'Enable Address Space Layout Randomization (ASLR) to randomize memory addresses',
      'Use stack canaries to detect stack smashing before return address overwrite',
      'Compile with -fstack-protector and -D_FORTIFY_SOURCE=2 flags',
      'Implement Data Execution Prevention (DEP/NX bit) to prevent shellcode execution',
      'Use memory-safe languages like Rust or employ bounds-checking in C/C++',
      'Apply Control Flow Integrity (CFI) to validate indirect call targets',
      'Regularly audit and fuzz test input handling code'
    ],
    severity: 'CRITICAL',
    prevention: 'ASLR + Stack Canaries + DEP',
    recovery: 'Isolate affected process, restore from clean backup, patch vulnerable code'
  },
  'trapdoor': {
    tips: [
      'Perform regular code audits and security reviews',
      'Use intrusion detection systems (IDS) to detect hidden services',
      'Monitor all listening ports and network connections continuously',
      'Implement allowlisting for network services and processes',
      'Use static analysis tools to detect backdoor patterns in source code',
      'Enforce principle of least privilege — no dev accounts in production',
      'Monitor authentication logs for unusual access patterns'
    ],
    severity: 'HIGH',
    prevention: 'Code Audits + Port Monitoring + IDS',
    recovery: 'Remove hidden accounts, audit all services, change all credentials'
  },
  'backdoor': {
    tips: [
      'Deploy endpoint detection and response (EDR) solutions',
      'Monitor outbound network connections for C2 communication patterns',
      'Use application whitelisting to prevent unauthorized process execution',
      'Implement network segmentation to limit lateral movement',
      'Regularly scan for rootkits using tools like chkrootkit and rkhunter',
      'Keep all software patched and updated',
      'Use integrity monitoring (AIDE, Tripwire) for critical system files'
    ],
    severity: 'CRITICAL',
    prevention: 'EDR + Network Monitoring + Integrity Checks',
    recovery: 'Wipe and reinstall OS, rotate all credentials, investigate root cause'
  },
  'cache-poisoning': {
    tips: [
      'Enable DNSSEC (DNS Security Extensions) for cryptographic validation',
      'Use DNS over HTTPS (DoH) or DNS over TLS (DoT)',
      'Configure trusted DNS resolvers with response rate limiting',
      'Implement source port randomization for DNS queries',
      'Monitor DNS responses for anomalies and unexpected IP changes',
      'Use short DNS TTLs for critical records to minimize poisoning window',
      'Deploy DNS firewall to block malicious domains'
    ],
    severity: 'HIGH',
    prevention: 'DNSSEC + DoH/DoT + DNS Monitoring',
    recovery: 'Flush DNS cache system-wide, investigate resolver logs, update to secure DNS'
  },
  'malware': {
    tips: [
      'Deploy next-generation antivirus with behavioral analysis',
      'Enable email filtering and sandbox analysis for attachments',
      'Keep all software and OS patches up to date',
      'Use browser isolation for web browsing',
      'Implement user training for phishing awareness',
      'Disable macros in Office documents by default',
      'Maintain offline backups (3-2-1 rule) to recover from ransomware'
    ],
    severity: 'CRITICAL',
    prevention: 'AV + Email Filtering + Patch Management + Backups',
    recovery: 'Isolate infected systems, restore from backup, conduct forensic analysis'
  },
  'deadlock': {
    tips: [
      'Implement lock ordering — always acquire locks in a consistent global order',
      'Use deadlock detection algorithms with periodic resource graph analysis',
      'Apply timeout mechanisms for resource acquisition (tryLock with timeout)',
      'Implement Banker\'s Algorithm for deadlock avoidance in resource allocation',
      'Use atomic operations and lock-free data structures where possible',
      'Monitor processes for abnormal blocking times',
      'Consider using RAII (Resource Acquisition Is Initialization) patterns'
    ],
    severity: 'HIGH',
    prevention: 'Lock Ordering + Timeouts + Banker\'s Algorithm',
    recovery: 'Kill deadlocked processes, release resources, restart with deadlock avoidance'
  },
  'cpu-starvation': {
    tips: [
      'Implement fair scheduling algorithms (CFS) to prevent starvation',
      'Apply cgroups/control groups to limit CPU usage per process',
      'Use resource quotas and rate limiting for untrusted processes',
      'Monitor CPU usage per process and alert on anomalies',
      'Implement aging in priority schedulers to boost long-waiting processes',
      'Use ulimit to restrict resource consumption per user',
      'Deploy process sandboxing to isolate resource-intensive processes'
    ],
    severity: 'MEDIUM',
    prevention: 'Fair Scheduling + cgroups + Resource Quotas',
    recovery: 'Kill greedy processes, adjust priorities, implement resource limits'
  },
  'unauthorized-access': {
    tips: [
      'Enforce principle of least privilege — grant minimum required permissions',
      'Implement Multi-Factor Authentication (MFA) for all sensitive accounts',
      'Use SELinux or AppArmor for mandatory access control (MAC)',
      'Audit SUID/SGID binaries and remove unnecessary permissions',
      'Monitor /var/log/auth.log and /var/log/secure for failed logins',
      'Implement PAM (Pluggable Authentication Modules) policies',
      'Use privilege escalation monitoring tools (sudo logs, auditd)'
    ],
    severity: 'HIGH',
    prevention: 'Least Privilege + MFA + MAC (SELinux/AppArmor)',
    recovery: 'Revoke compromised credentials, audit all access logs, apply patches'
  },
  'suspicious-ipc': {
    tips: [
      'Restrict IPC access using permissions and namespace isolation',
      'Monitor IPC channel usage with auditd rules',
      'Use seccomp BPF to restrict system calls available to processes',
      'Apply IPC namespaces (Linux) to isolate containers/processes',
      'Validate and sanitize all IPC message contents',
      'Implement message authentication codes (MAC) for IPC integrity',
      'Use encrypted IPC channels for sensitive inter-process communication'
    ],
    severity: 'MEDIUM',
    prevention: 'IPC Namespaces + Seccomp + Message Validation',
    recovery: 'Terminate suspicious processes, audit IPC logs, harden permissions'
  },
  'memory-abuse': {
    tips: [
      'Use memory-safe languages (Rust, Go) or smart pointers in C++',
      'Enable AddressSanitizer (ASAN) and Valgrind in development',
      'Implement OOM (Out of Memory) killer policies with cgroups memory limits',
      'Use memory analysis tools like Massif and Heaptrack in production',
      'Apply copy-on-write and demand paging to optimize memory usage',
      'Monitor process memory usage with alerts on rapid growth',
      'Implement memory guard pages to detect use-after-free and overflows'
    ],
    severity: 'HIGH',
    prevention: 'Memory-safe Languages + ASAN + cgroups Memory Limits',
    recovery: 'Kill leaking processes, restart services, analyze core dumps'
  }
};

// POST /api/v1/ai/prevention
const getPreventionTips = async (req, res) => {
  try {
    const { attackType, severity = 'HIGH', details } = req.body;
    if (!attackType) return res.status(400).json({ success: false, message: 'attackType is required' });

    const key = attackType.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z-]/g,'');

    // Try OpenAI if key is available
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-')) {
      try {
        const { OpenAI } = require('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          max_tokens: 500,
          messages: [{
            role: 'system',
            content: 'You are a cybersecurity expert specializing in OS security. Provide practical, actionable prevention tips in JSON format.'
          }, {
            role: 'user',
            content: `Provide 5 prevention tips for a ${severity} severity ${attackType} attack on an OS.
            Return JSON: { "tips": ["tip1","tip2",...], "prevention": "short summary", "recovery": "recovery steps" }`
          }]
        });

        const text = completion.choices[0]?.message?.content || '';
        const cleaned = text.replace(/```json|```/g, '').trim();
        const data = JSON.parse(cleaned);
        return res.json({ success: true, data: { ...data, attackType, severity, source: 'ai' } });
      } catch (aiErr) {
        console.warn('OpenAI failed, using static tips:', aiErr.message);
      }
    }

    // Fallback to static tips
    const staticKey = Object.keys(STATIC_TIPS).find(k => key.includes(k) || k.includes(key)) || key;
    const tips = STATIC_TIPS[staticKey] || {
      tips: [
        'Apply principle of least privilege',
        'Keep all software updated and patched',
        'Enable comprehensive logging and monitoring',
        'Use multi-factor authentication',
        'Implement network segmentation and firewalls'
      ],
      prevention: 'Follow security best practices',
      recovery: 'Isolate, investigate, remediate, and monitor'
    };

    res.json({ success: true, data: { ...tips, attackType, severity, source: 'static' } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/ai/analyze
const analyzeAttackPattern = async (req, res) => {
  try {
    const { attacks = [] } = req.body;

    if (!attacks.length) return res.status(400).json({ success: false, message: 'attacks array required' });

    const byType = {};
    attacks.forEach(a => { byType[a.attackType] = (byType[a.attackType]||0)+1; });
    const mostCommon = Object.entries(byType).sort((a,b)=>b[1]-a[1])[0];

    const analysis = {
      totalAttacks:    attacks.length,
      uniqueTypes:     Object.keys(byType).length,
      mostCommon:      mostCommon ? { type: mostCommon[0], count: mostCommon[1] } : null,
      criticalCount:   attacks.filter(a=>a.severity==='CRITICAL').length,
      riskScore:       Math.min(100, attacks.length * 5 + attacks.filter(a=>a.severity==='CRITICAL').length * 15),
      recommendation:  mostCommon ? `Focus on preventing ${mostCommon[0]} attacks — occurring most frequently.` : 'Monitor all attack vectors.',
      patterns:        Object.entries(byType).map(([type,count]) => ({ type, count, percentage: ((count/attacks.length)*100).toFixed(1)+'%' }))
    };

    res.json({ success: true, data: analysis });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/ai/tips/:attackType
const getStaticTips = async (req, res) => {
  try {
    const key  = req.params.attackType.toLowerCase().replace(/\s+/g,'-');
    const tips = STATIC_TIPS[key] || STATIC_TIPS['buffer-overflow'];
    res.json({ success: true, data: { ...tips, attackType: req.params.attackType } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getPreventionTips, analyzeAttackPattern, getStaticTips };
