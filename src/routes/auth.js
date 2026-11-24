const express = require('express');
const bcrypt = require('bcryptjs');
const argon2 = require('argon2');
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

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

// SEC-01: Secure authentication
router.post('/login', async (req, res, next) => {
  const loginFailed = () => {
    req.session.flash = {
      type: 'error',
      text: 'Invalid email or password.'
    };
    return res.redirect('/login');
  };

  try {
    const { email, password } = req.body;

    // Reject invalid input types
    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      email.length > 254 ||
      password.length > 1024
    ) {
      return loginFailed();
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase()
    });

    if (!user) {
      return loginFailed();
    }

    // Reject login attempts while the account is locked
    if (user.lockUntil && user.lockUntil > new Date()) {
      return loginFailed();
    }

    // Reset the counter after a previous lock expires
    if (user.lockUntil) {
      user.failedLoginAttempts = 0;
      user.lockUntil = null;
    }

    let passwordMatches = false;
    let upgradeHash = false;

    if (user.password.startsWith('$argon2id$')) {
      // Verify an Argon2id password
      passwordMatches = await argon2.verify(
        user.password,
        password
      );
    } else if (/^\$2[aby]\$/.test(user.password)) {
      // Support existing bcrypt demo accounts
      passwordMatches = await bcrypt.compare(
        password,
        user.password
      );
      upgradeHash = passwordMatches;
    }

    if (!passwordMatches) {
      user.failedLoginAttempts =
        (user.failedLoginAttempts || 0) + 1;

      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        user.lockUntil = new Date(
          Date.now() + LOCK_DURATION_MS
        );
      }

      await user.save();
      return loginFailed();
    }

    // Upgrade a valid bcrypt password to Argon2id
    if (upgradeHash) {
      user.password = await argon2.hash(password, {
        type: argon2.argon2id
      });
    }

    // Reset failed attempts following successful login
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    
    // SEC-02: Regenerate session ID after successful login
    return req.session.regenerate((err) => {
      if (err) return next(err);

      req.session.user = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      };

      // Start tracking activity from the moment of login
      req.session.lastActivityAt = Date.now();

      req.session.save((saveErr) => {
        if (saveErr) return next(saveErr);
        return res.redirect('/');
      });
    });

  } catch (err) {
    return next(err);
  }
});



 // SEC-02: Secure logout
router.get('/logout', (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);

    // Remove the session cookie from the browser
    res.clearCookie('connect.sid', {
      path: '/',
      sameSite: 'lax',
      secure: process.env.SESSION_COOKIE_SECURE === 'true'
    });

    return res.redirect('/login');
  });
});


module.exports = router;
