const express = require('express');
const Module = require('../models/Module');
const Announcement = require('../models/Announcement');
const Assignment = require('../models/Assignment');
const { requireLogin, requireRole } = require('../middleware/auth');

const router = express.Router();

// List modules (students: enrolled, lecturers: teaching, admins: all) with optional search
router.get('/', requireLogin, async (req, res) => {
  const user = req.session.user;
  const q = req.query.q || '';

  const filter = {};
  if (user.role === 'student') filter.students = user.id;
  if (user.role === 'lecturer') filter.lecturer = user.id;
  if (q) {
    filter.$or = [{ code: new RegExp(q, 'i') }, { title: new RegExp(q, 'i') }];
  }

  const modules = await Module.find(filter).populate('lecturer').sort('code');
  res.render('modules/index', { title: 'Modules', modules, q });
});

// Module page: details, announcements and assignments
router.get('/:id', requireLogin, async (req, res) => {
  const mod = await Module.findById(req.params.id).populate('lecturer').populate('students');
  if (!mod) {
    return res.status(404).render('error', { title: 'Not found', message: 'Module not found.' });
  }

  const announcements = await Announcement.find({ module: mod._id })
    .populate('author')
    .sort('-createdAt');
  const assignments = await Assignment.find({ module: mod._id }).sort('dueDate');

  res.render('modules/show', { title: mod.code, module: mod, announcements, assignments });
});

// Post an announcement to a module
router.post('/:id/announcements', requireRole('lecturer', 'admin'), async (req, res) => {
  const { title, body } = req.body;

  await Announcement.create({
    module: req.params.id,
    author: req.session.user.id,
    title,
    body,
  });

  req.session.flash = { type: 'success', text: 'Announcement posted.' };
  res.redirect('/modules/' + req.params.id);
});

// New assignment form
router.get('/:id/assignments/new', requireRole('lecturer', 'admin'), async (req, res) => {
  const mod = await Module.findById(req.params.id);
  if (!mod) {
    return res.status(404).render('error', { title: 'Not found', message: 'Module not found.' });
  }
  res.render('assignments/form', { title: 'New assignment', module: mod, assignment: null });
});

// Create an assignment
router.post('/:id/assignments', requireRole('lecturer', 'admin'), async (req, res) => {
  const { title, description, dueDate, maxMarks } = req.body;

  const assignment = await Assignment.create({
    module: req.params.id,
    title,
    description,
    dueDate,
    maxMarks: maxMarks || 100,
  });

  req.session.flash = { type: 'success', text: 'Assignment created.' };
  res.redirect('/assignments/' + assignment._id);
});

module.exports = router;
