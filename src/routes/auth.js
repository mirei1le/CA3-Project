const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

// Login page
router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('login', { title: 'Log in' });
});

// Handle login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email });
  if (!user) {
    req.session.flash = { type: 'error', text: 'Invalid email or password.' };
    return res.redirect('/login');
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    req.session.flash = { type: 'error', text: 'Invalid email or password.' };
    return res.redirect('/login');
  }

  // Remember who is logged in
  req.session.user = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  };
  res.redirect('/');
});

// Log out
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;
