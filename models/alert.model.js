// ============================================================
// models/alert.model.js
// ============================================================
const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  message:   { type: String, required: true },
  severity:  { type: String, enum: ['CRITICAL','DANGER','HIGH','MEDIUM','LOW','INFO'], default: 'MEDIUM' },
  isRead:    { type: Boolean, default: false },
  attackLog: { type: mongoose.Schema.Types.ObjectId, ref: 'AttackLog' },
  source:    { type: String, default: 'system' }
}, { timestamps: true });

alertSchema.index({ createdAt: -1 });
alertSchema.index({ isRead: 1 });

module.exports = mongoose.model('Alert', alertSchema);
