const express = require('express');
const Announcement = require('../models/Announcement');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// Edit announcement form
router.get('/:id/edit', requireRole('lecturer', 'admin'), async (req, res) => {
  const announcement = await Announcement.findById(req.params.id).populate('module');
  if (!announcement) {
    return res
      .status(404)
      .render('error', { title: 'Not found', message: 'Announcement not found.' });
  }
  res.render('announcements/edit', { title: 'Edit announcement', announcement });
});

// Update an announcement
router.post('/:id', requireRole('lecturer', 'admin'), async (req, res) => {
  const { title, body } = req.body;

  const announcement = await Announcement.findByIdAndUpdate(req.params.id, { title, body });

  req.session.flash = { type: 'success', text: 'Announcement updated.' };
  res.redirect('/modules/' + announcement.module);
});

// Delete an announcement
router.post('/:id/delete', requireRole('lecturer', 'admin'), async (req, res) => {
  const announcement = await Announcement.findByIdAndDelete(req.params.id);

  req.session.flash = { type: 'success', text: 'Announcement deleted.' };
  res.redirect('/modules/' + announcement.module);
});

module.exports = router;
