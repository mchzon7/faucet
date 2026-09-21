const express = require("express");
const User = require("../models/user.model");
const {protect } = require('../middleware/auth');
const router = express.Router();
const cron = require('node-cron');

// Prize Pool Mapping
const PRIZE_POOL = [30, 20, 15, 10, 8, 6, 4, 3, 2, 2]; // Total: $100
const getEstimatedReward = (rank) => PRIZE_POOL[rank - 1] ? `$${PRIZE_POOL[rank - 1]}` : '$0';

// 3. Automated Weekly Reset Cron Job
// Cron Syntax: Minute Hour Day-of-Month Month Day-of-Week (0 = Sunday)
cron.schedule('59 23 * * 0', async () => {
  console.log('[CRON] Starting weekly referral contest settlement...');

  try {
    // Step A: Fetch top 10 winners before reset
    const winners = await User.find({})
      .sort({ weeklyReferrals: -1 })
      .limit(10);

    console.log('=== WEEKLY WINNERS ($100 DISTRIBUTION) ===');
    winners.forEach((user, index) => {
      const reward = PRIZE_POOL[index] || 0;
      console.log(`Rank #${index + 1}: ${user.name} (${user.email}) - ${user.weeklyReferrals} referrals -> Earned $${reward}`);
    });

    // Step B: Reset weekly counters for ALL users
    const updateResult = await User.updateMany({}, { $set: { weeklyReferrals: 0 } });
    console.log(`[CRON] Successfully reset weeklyReferrals for ${updateResult.modifiedCount} users.`);

  } catch (err) {
    console.error('[CRON ERROR] Failed to reset weekly referrals:', err);
  }
}, {
  scheduled: true,
  timezone: "UTC" // Set to your preferred time zone (e.g., "America/New_York", "UTC")
});

// 4. Routes
router.get('/rcontest',protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const topUsers = await User.find({})
      .sort({ weeklyReferrals: -1 })
      .limit(10);

    res.render('../views/new/rcontest', { 
      topUsers, 
      getEstimatedReward,
      title: 'Convert Points',
      appName: 'luwentcash',
      error: null,
      user: user,
      success: null 
    });
  } catch (err) {
    res.status(500).send('Server Error: ' + err.message);
  }
});
module.exports= router;