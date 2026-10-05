const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const {protect } = require('../middleware/auth');

// Utility function to get client IP
const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
};


// GET /surveys
// GET /surveys - Render iFrame Survey Wall
router.get('/surveys', protect , async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.render('../views/new/surveys', {
      user,
      cpxAppId: process.env.CPX_APP_ID,
      title: 'FluwentCash', appName: process.env.APP_NAME
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;