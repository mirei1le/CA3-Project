const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Uploaded file
  filename: String, // name of the file on disk (in /uploads)
  originalName: String, // name of the file the student uploaded
  comment: String,
  submittedAt: { type: Date, default: Date.now },

  // Grading (filled in by a lecturer)
  grade: Number,
  feedback: String,
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  gradedAt: Date,
});

module.exports = mongoose.model('Submission', submissionSchema);
