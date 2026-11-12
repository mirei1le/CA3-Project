const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();

// View my profile
router.get('/', requireLogin, async (req, res) => {
  const user = await User.findById(req.session.user.id);
  res.render('profile', { title: 'My profile', user });
});

// Update my personal details
router.post('/', requireLogin, async (req, res) => {
  const { name, phone, address, dateOfBirth } = req.body;

  await User.findByIdAndUpdate(req.session.user.id, { name, phone, address, dateOfBirth });
  req.session.user.name = name;

  req.session.flash = { type: 'success', text: 'Profile updated.' };
  res.redirect('/profile');
});

// Change my password
router.post('/password', requireLogin, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.session.user.id);

  const passwordMatches = await bcrypt.compare(currentPassword, user.password);
  if (!passwordMatches) {
    req.session.flash = { type: 'error', text: 'Current password is incorrect.' };
    return res.redirect('/profile');
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  req.session.flash = { type: 'success', text: 'Password changed.' };
  res.redirect('/profile');
});

module.exports = router;
