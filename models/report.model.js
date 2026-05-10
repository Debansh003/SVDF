// ============================================================
// models/report.model.js
// ============================================================
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  type:        { type: String, enum: ['security','attack','full'], default: 'full' },
  content:     { type: String },
  filePath:    { type: String },
  fileSize:    { type: Number },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  stats:       { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
