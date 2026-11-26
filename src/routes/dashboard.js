const express = require('express');
const User = require('../models/User');
const Module = require('../models/Module');
const Announcement = require('../models/Announcement');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();

// Dashboard - shows different things depending on the user's role
router.get('/', requireLogin, async (req, res) => {
  const user = req.session.user;

  if (user.role === 'admin') {
    const stats = {
      students: await User.countDocuments({ role: 'student' }),
      lecturers: await User.countDocuments({ role: 'lecturer' }),
      admins: await User.countDocuments({ role: 'admin' }),
      modules: await Module.countDocuments(),
      assignments: await Assignment.countDocuments(),
      submissions: await Submission.countDocuments(),
    };
    return res.render('dashboard', { title: 'Dashboard', stats });
  }

  // Students see modules they are enrolled in, lecturers see modules they teach
  const moduleFilter = user.role === 'student' ? { students: user.id } : { lecturer: user.id };
  const modules = await Module.find(moduleFilter).populate('lecturer').sort('code');
  const moduleIds = modules.map((m) => m._id);

  const announcements = await Announcement.find({ module: { $in: moduleIds } })
    .populate('module')
    .populate('author')
    .sort('-createdAt')
    .limit(5);

  const assignments = await Assignment.find({ module: { $in: moduleIds } })
    .populate('module')
    .sort('dueDate');

  if (user.role === 'student') {
    // Work out which assignments this student has already submitted
    const mySubmissions = await Submission.find({ student: user.id });
    const submittedIds = mySubmissions.map((s) => s.assignment.toString());
    return res.render('dashboard', {
      title: 'Dashboard',
      modules,
      announcements,
      assignments,
      submittedIds,
    });
  }

  // Lecturer: count submissions that still need a grade
  const assignmentIds = assignments.map((a) => a._id);
  const toGrade = await Submission.countDocuments({
    assignment: { $in: assignmentIds },
    grade: null,
  });
  res.render('dashboard', { title: 'Dashboard', modules, announcements, assignments, toGrade });
});

module.exports = router;
