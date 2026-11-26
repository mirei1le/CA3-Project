const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const { requireLogin, requireRole } = require('../middleware/auth');

const router = express.Router();

// Uploaded files are saved to the /uploads folder
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage });

// Assignment page
// - students see the brief, their own submission and the upload form
// - lecturers and admins see every submission and can grade them
router.get('/:id', requireLogin, async (req, res) => {
  const user = req.session.user;
  const assignment = await Assignment.findById(req.params.id).populate('module');
  if (!assignment) {
    return res.status(404).render('error', { title: 'Not found', message: 'Assignment not found.' });
  }

  if (user.role === 'student') {
    const mySubmission = await Submission.findOne({ assignment: assignment._id, student: user.id });
    return res.render('assignments/show', {
      title: assignment.title,
      assignment,
      mySubmission,
      submissions: [],
    });
  }

  const submissions = await Submission.find({ assignment: assignment._id })
    .populate('student')
    .sort('submittedAt');
  res.render('assignments/show', {
    title: assignment.title,
    assignment,
    mySubmission: null,
    submissions,
  });
});

// Edit assignment form
router.get('/:id/edit', requireRole('lecturer', 'admin'), async (req, res) => {
  const assignment = await Assignment.findById(req.params.id).populate('module');
  if (!assignment) {
    return res.status(404).render('error', { title: 'Not found', message: 'Assignment not found.' });
  }
  res.render('assignments/form', {
    title: 'Edit assignment',
    module: assignment.module,
    assignment,
  });
});

// Update an assignment
router.post('/:id', requireRole('lecturer', 'admin'), async (req, res) => {
  const { title, description, dueDate, maxMarks } = req.body;

  await Assignment.findByIdAndUpdate(req.params.id, { title, description, dueDate, maxMarks });

  req.session.flash = { type: 'success', text: 'Assignment updated.' };
  res.redirect('/assignments/' + req.params.id);
});

// Delete an assignment (and its submissions)
router.post('/:id/delete', requireRole('lecturer', 'admin'), async (req, res) => {
  const assignment = await Assignment.findByIdAndDelete(req.params.id);
  await Submission.deleteMany({ assignment: req.params.id });

  req.session.flash = { type: 'success', text: 'Assignment deleted.' };
  res.redirect('/modules/' + assignment.module);
});

// Student uploads (or replaces) their submission
router.post('/:id/submit', requireRole('student'), upload.single('file'), async (req, res) => {
  if (!req.file) {
    req.session.flash = { type: 'error', text: 'Please choose a file to upload.' };
    return res.redirect('/assignments/' + req.params.id);
  }

  const existing = await Submission.findOne({
    assignment: req.params.id,
    student: req.session.user.id,
  });

  if (existing) {
    // Replace the previous submission (and remove the old file from disk)
    fs.unlink(path.join(uploadDir, existing.filename), () => {});
    existing.filename = req.file.filename;
    existing.originalName = req.file.originalname;
    existing.comment = req.body.comment;
    existing.submittedAt = new Date();
    await existing.save();
  } else {
    await Submission.create({
      assignment: req.params.id,
      student: req.session.user.id,
      filename: req.file.filename,
      originalName: req.file.originalname,
      comment: req.body.comment,
    });
  }

  req.session.flash = { type: 'success', text: 'Submission uploaded.' };
  res.redirect('/assignments/' + req.params.id);
});

module.exports = router;
