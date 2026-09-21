const express = require("express");
const router = express.Router();
const User = require("../models/user.model");
const isBlocked = require('./checkblockuser');
const { protect } = require("../middleware/auth");


router.get("/referral",protect, async (req, res) => {
  const user = await User.findById(req.user._id)
  if (!user) {
    req.flash("error_msg", "please login");
    return res.redirect("/login");
  }

  const userId = user;

  const recentReferrals = await User.find({referrer: userId})
      .sort({createdAt: -1})
      .limit(5)
      .select("name createdAt");

  res.render("../views/new/referral", { user, recentReferrals, appName: process.env.APP_NAME, title: 'FluwentCash' });
});

module.exports = router;
