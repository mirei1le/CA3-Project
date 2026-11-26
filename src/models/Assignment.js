const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
  title: { type: String, required: true },
  description: String,
  dueDate: { type: Date, required: true },
  maxMarks: { type: Number, default: 100 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Assignment', assignmentSchema);
