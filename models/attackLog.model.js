// ============================================================
// models/attackLog.model.js
// ============================================================
const mongoose = require('mongoose');

const attackLogSchema = new mongoose.Schema({
  attackType:  { type: String, required: true },
  severity:    { type: String, enum: ['CRITICAL','HIGH','MEDIUM','LOW'], default: 'HIGH' },
  status:      { type: String, enum: ['DETECTED','BLOCKED','RESOLVED'], default: 'DETECTED' },
  target:      { type: String, default: 'System Process' },
  description: { type: String },
  details:     { type: mongoose.Schema.Types.Mixed },
  triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ipAddress:   { type: String }
}, { timestamps: true });

attackLogSchema.index({ createdAt: -1 });
attackLogSchema.index({ severity: 1 });

module.exports = mongoose.model('AttackLog', attackLogSchema);
