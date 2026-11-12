const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  code: { type: String, required: true },
  title: { type: String, required: true },
  description: String,
  lecturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Module', moduleSchema);
