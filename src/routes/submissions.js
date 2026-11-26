const express = require('express');
const path = require('path');
const fs = require('fs');
const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const Module = require('../models/Module');
const { requireLogin, requireRole } = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', '..', 'uploads');

// Download a submitted file
router.get('/:id/download', requireLogin, async (req, res) => {
  const submission = await Submission.findById(req.params.id);

  if (!submission) {
    return res.status(404).render('error', {
      title: 'Not found',
      message: 'Submission not found.',
    });
  }

  res.download(path.join(uploadDir, submission.filename), submission.originalName);
});

// Lecturer grades a submission
router.post('/:id/grade', requireRole('lecturer', 'admin'), async (req, res) => {
  const { grade, feedback } = req.body;

  const submission = await Submission.findById(req.params.id);

  if (!submission) {
    return res.status(404).render('error', {
      title: 'Not found',
      message: 'Submission not found.',
    });
  }

  // Check that lecturers can only grade submissions from their own modules
  if (req.session.user.role === 'lecturer') {
    const assignment = await Assignment.findById(submission.assignment);
    const moduleData = await Module.findById(assignment.module);

    if (
      !moduleData ||
      !moduleData.lecturer ||
      moduleData.lecturer.toString() !== req.session.user.id
    ) {
      return res.status(403).render('error', {
        title: 'Forbidden',
        message: 'You are not authorised to grade submissions for this module.',
      });
    }
  }

  submission.grade = grade;
  submission.feedback = feedback;
  submission.gradedBy = req.session.user.id;
  submission.gradedAt = new Date();

  await submission.save();

  req.session.flash = { type: 'success', text: 'Grade saved.' };
  res.redirect('/assignments/' + submission.assignment);
});

// Student deletes their submission
router.post('/:id/delete', requireRole('student'), async (req, res) => {
  const submission = await Submission.findById(req.params.id);

  if (!submission) {
    return res.status(404).render('error', {
      title: 'Not found',
      message: 'Submission not found.',
    });
  }

  // Check that students can only delete their own submissions
  if (submission.student.toString() !== req.session.user.id) {
    return res.status(403).render('error', {
      title: 'Forbidden',
      message: 'You may only delete your own submissions.',
    });
  }

  await Submission.findByIdAndDelete(req.params.id);

  // Remove the uploaded file from disk as well
  fs.unlink(path.join(uploadDir, submission.filename), () => {});

  req.session.flash = { type: 'success', text: 'Submission deleted.' };
  res.redirect('/assignments/' + submission.assignment);
});

module.exports = router;