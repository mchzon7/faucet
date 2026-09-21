const express = require('express');
const router = express.Router();
const User = require('../models/user.model'); // Adjust to match your User model path
const {protect } = require('../middleware/auth');

const CONVERSION_RATE = 20; // 20 points = 1 USDT
const MIN_POINTS = 5;       // Minimum required points to convert

// Render the point conversion page
router.get('/convert',protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.render('../views/new/convert', {
      title: 'Convert Points',
      appName: 'luwentcash',
      user: user,
      error: null,
      success: null
    });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Process point conversion logic
router.post('/convert',protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).lean();
    const { pointsToConvert } = req.body;
    const points = Number(pointsToConvert);
    const userId = user;


    // 1. Validate inputs and minimum threshold
    if (!points || isNaN(points) || points <= 0 || !Number.isInteger(points)) {
      return res.render('../views/new/convert', {
        title: 'Convert Points',
        appName: 'Fluwent',
        user: user,
        error: 'Please enter a valid whole number of points.',
        success: null
      });
    }

    if (points < MIN_POINTS) {
      return res.render('../views/new/convert', {
        title: 'Convert Points',
        appName: 'Fluwent',
        user: user,
        error: `You need at least ${MIN_POINTS} points to convert.`,
        success: null
      });
    }

    if (user.points < points) {
      return res.render('../views/new/convert', {
        title: 'Convert Points',
        appName: 'Fluwent',
        user: user,
        error: 'You do not have enough points for this conversion.',
        success: null
      });
    }

    // 2. Calculate USDT amount
    const usdtAmount = points / CONVERSION_RATE;

    // 3. Atomically update user balance and points in MongoDB
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $inc: {
          points: -points,
          balance: usdtAmount
        }
      },
      { new: true }
    );

    return res.render('../views/new/convert', {
      title: 'Convert Points',
      appName: 'Fluwent',
      user: updatedUser,
      error: null,
      success: `Successfully converted ${points} points to $${usdtAmount.toFixed(4)} USDT!`
    });

  } catch (err) {
    console.error('Conversion Error:', err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;