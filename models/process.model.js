// ============================================================
// models/process.model.js
// ============================================================
const mongoose = require('mongoose');

const processSchema = new mongoose.Schema({
  pid:          { type: String, required: true, unique: true },
  name:         { type: String, required: true },
  arrivalTime:  { type: Number, default: 0 },
  burstTime:    { type: Number, required: true },
  priority:     { type: Number, default: 1 },
  state:        { type: String, enum: ['new','ready','running','waiting','terminated'], default: 'new' },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Process', processSchema);
