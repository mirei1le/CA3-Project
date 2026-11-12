const express = require('express');
const Submission = require('../models/Submission');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// A student's grades across all their modules
router.get('/', requireRole('student'), async (req, res) => {
  const submissions = await Submission.find({ student: req.session.user.id })
    .populate({ path: 'assignment', populate: { path: 'module' } })
    .sort('-submittedAt');

  res.render('grades', { title: 'My grades', submissions });
});

module.exports = router;
