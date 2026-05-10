// ============================================================
// seed.js - Database Seeder
// ============================================================
// Run this ONCE to populate the database with:
//   - Default admin and user accounts
//   - Sample attack logs
//
// Usage: node seed.js
// ============================================================

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const dotenv   = require('dotenv');

dotenv.config();

const User      = require('./models/user.model');
const AttackLog = require('./models/attackLog.model');
const Alert     = require('./models/alert.model');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/os_security_db';

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // ---- Clear existing data ----
    await User.deleteMany({});
    await AttackLog.deleteMany({});
    await Alert.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // ---- Create Admin User ----
    const admin = await User.create({
      username: 'admin',
      email:    'admin@ossecurity.com',
      password: 'admin123',     // Will be hashed by pre-save hook
      role:     'admin'
    });
    console.log(`👤 Admin created: admin@ossecurity.com / admin123`);

    // ---- Create Regular User ----
    const user = await User.create({
      username: 'analyst',
      email:    'analyst@ossecurity.com',
      password: 'analyst123',
      role:     'user'
    });
    console.log(`👤 User created: analyst@ossecurity.com / analyst123`);

    // ---- Create Sample Attack Logs ----
    const attackTypes = [
      { attackType: 'Buffer Overflow',              severity: 'CRITICAL', status: 'DETECTED' },
      { attackType: 'Malware Injection',             severity: 'CRITICAL', status: 'BLOCKED'  },
      { attackType: 'Cache Poisoning',               severity: 'HIGH',     status: 'RESOLVED' },
      { attackType: 'Backdoor Attack',               severity: 'CRITICAL', status: 'DETECTED' },
      { attackType: 'Deadlock',                      severity: 'HIGH',     status: 'RESOLVED' },
      { attackType: 'CPU Starvation',                severity: 'MEDIUM',   status: 'DETECTED' },
      { attackType: 'Trapdoor Attack',               severity: 'HIGH',     status: 'BLOCKED'  },
      { attackType: 'Memory Abuse',                  severity: 'HIGH',     status: 'DETECTED' },
      { attackType: 'Suspicious IPC Communication',  severity: 'MEDIUM',   status: 'DETECTED' },
      { attackType: 'Unauthorized Process Access',   severity: 'HIGH',     status: 'BLOCKED'  }
    ];

    const logs = await AttackLog.insertMany(
      attackTypes.map(a => ({
        ...a,
        target:      `System Process PID-${Math.floor(Math.random() * 9000) + 1000}`,
        description: `Sample ${a.attackType} simulation for testing purposes.`,
        triggeredBy: admin._id
      }))
    );
    console.log(`🗂️  Created ${logs.length} sample attack logs`);

    // ---- Create Sample Alerts ----
    await Alert.insertMany(
      logs.slice(0, 5).map(log => ({
        title:     `Alert: ${log.attackType} Detected`,
        message:   `${log.attackType} was detected with ${log.severity} severity.`,
        severity:  log.severity === 'CRITICAL' ? 'CRITICAL' : 'DANGER',
        attackLog: log._id,
        isRead:    false
      }))
    );
    console.log(`🔔 Created 5 sample alerts`);

    console.log('\n====================================================');
    console.log('✅ Database seeded successfully!');
    console.log('====================================================');
    console.log('Login Credentials:');
    console.log('  Admin:   admin@ossecurity.com    / admin123');
    console.log('  User:    analyst@ossecurity.com  / analyst123');
    console.log('====================================================');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
};

seed();
