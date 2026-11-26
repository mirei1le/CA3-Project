const express = require('express');
const path = require('path');
const fs = require('fs');
const Submission = require('../models/Submission');
const { requireLogin, requireRole } = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', '..', 'uploads');

// Download a submitted file
router.get('/:id/download', requireLogin, async (req, res) => {
  const submission = await Submission.findById(req.params.id);
  if (!submission) {
    return res.status(404).render('error', { title: 'Not found', message: 'Submission not found.' });
  }
  res.download(path.join(uploadDir, submission.filename), submission.originalName);
});

// Lecturer grades a submission
router.post('/:id/grade', requireRole('lecturer', 'admin'), async (req, res) => {
  const { grade, feedback } = req.body;

  const submission = await Submission.findByIdAndUpdate(req.params.id, {
    grade,
    feedback,
    gradedBy: req.session.user.id,
    gradedAt: new Date(),
  });

  req.session.flash = { type: 'success', text: 'Grade saved.' };
  res.redirect('/assignments/' + submission.assignment);
});

// Student deletes their submission
router.post('/:id/delete', requireRole('student'), async (req, res) => {
  const submission = await Submission.findByIdAndDelete(req.params.id);

  // Remove the uploaded file from disk as well
  fs.unlink(path.join(uploadDir, submission.filename), () => {});

  req.session.flash = { type: 'success', text: 'Submission deleted.' };
  res.redirect('/assignments/' + submission.assignment);
});

module.exports = router;
