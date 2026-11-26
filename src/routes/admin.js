const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Module = require('../models/Module');
const Announcement = require('../models/Announcement');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// Everything under /admin is for admins only
router.use(requireRole('admin'));

// ---------- Users ----------

// List users, with optional search by name or email
router.get('/users', async (req, res) => {
  const q = req.query.q || '';

  let filter = {};
  if (q) {
    filter = { $or: [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }] };
  }

  const users = await User.find(filter).sort('role name');
  res.render('admin/users', { title: 'Manage users', users, q });
});

// New user form
router.get('/users/new', (req, res) => {
  res.render('admin/user_form', { title: 'New user', user: null });
});

// Create a user
router.post('/users', async (req, res) => {
  const { name, email, password, role, studentNumber, phone, address, dateOfBirth } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    req.session.flash = { type: 'error', text: 'A user with that email already exists.' };
    return res.redirect('/admin/users/new');
  }

  await User.create({
    name,
    email,
    password: await bcrypt.hash(password, 10),
    role,
    studentNumber,
    phone,
    address,
    dateOfBirth,
  });

  req.session.flash = { type: 'success', text: 'User created.' };
  res.redirect('/admin/users');
});

// Edit user form
router.get('/users/:id/edit', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).render('error', { title: 'Not found', message: 'User not found.' });
  }
  res.render('admin/user_form', { title: 'Edit user', user });
});

// Update a user (including their role)
router.post('/users/:id', async (req, res) => {
  const { name, email, password, role, studentNumber, phone, address, dateOfBirth } = req.body;

  const update = { name, email, role, studentNumber, phone, address, dateOfBirth };
  if (password) {
    // Only change the password if a new one was typed in
    update.password = await bcrypt.hash(password, 10);
  }
  await User.findByIdAndUpdate(req.params.id, update);

  req.session.flash = { type: 'success', text: 'User updated.' };
  res.redirect('/admin/users');
});

// Delete a user
router.post('/users/:id/delete', async (req, res) => {
  if (req.params.id === req.session.user.id) {
    req.session.flash = { type: 'error', text: 'You cannot delete your own account.' };
    return res.redirect('/admin/users');
  }

  await User.findByIdAndDelete(req.params.id);
  // Tidy up: remove them from modules and delete their submissions
  await Module.updateMany({}, { $pull: { students: req.params.id } });
  await Submission.deleteMany({ student: req.params.id });

  req.session.flash = { type: 'success', text: 'User deleted.' };
  res.redirect('/admin/users');
});

// ---------- Modules ----------

// New module form
router.get('/modules/new', async (req, res) => {
  const lecturers = await User.find({ role: 'lecturer' }).sort('name');
  const students = await User.find({ role: 'student' }).sort('name');
  res.render('modules/form', { title: 'New module', module: null, lecturers, students });
});

// Create a module
router.post('/modules', async (req, res) => {
  const { code, title, description, lecturer, students } = req.body;

  const mod = await Module.create({
    code,
    title,
    description,
    lecturer: lecturer || undefined,
    students: students || [],
  });

  req.session.flash = { type: 'success', text: 'Module created.' };
  res.redirect('/modules/' + mod._id);
});

// Edit module form (also used to enrol students)
router.get('/modules/:id/edit', async (req, res) => {
  const mod = await Module.findById(req.params.id);
  if (!mod) {
    return res.status(404).render('error', { title: 'Not found', message: 'Module not found.' });
  }
  const lecturers = await User.find({ role: 'lecturer' }).sort('name');
  const students = await User.find({ role: 'student' }).sort('name');
  res.render('modules/form', { title: 'Edit module', module: mod, lecturers, students });
});

// Update a module
router.post('/modules/:id', async (req, res) => {
  const { code, title, description, lecturer, students } = req.body;

  await Module.findByIdAndUpdate(req.params.id, {
    code,
    title,
    description,
    lecturer: lecturer || null,
    students: students || [],
  });

  req.session.flash = { type: 'success', text: 'Module updated.' };
  res.redirect('/modules/' + req.params.id);
});

// Delete a module and everything inside it
router.post('/modules/:id/delete', async (req, res) => {
  const assignments = await Assignment.find({ module: req.params.id });
  const assignmentIds = assignments.map((a) => a._id);

  await Submission.deleteMany({ assignment: { $in: assignmentIds } });
  await Assignment.deleteMany({ module: req.params.id });
  await Announcement.deleteMany({ module: req.params.id });
  await Module.findByIdAndDelete(req.params.id);

  req.session.flash = { type: 'success', text: 'Module deleted.' };
  res.redirect('/modules');
});

module.exports = router;
