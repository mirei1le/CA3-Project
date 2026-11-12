const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'lecturer', 'admin'], default: 'student' },

  // Personal details shown on the profile page
  studentNumber: String,
  phone: String,
  address: String,
  dateOfBirth: String,

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
