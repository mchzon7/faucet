const express = require("express");
const router = express.Router();
const User = require("../models/user.model");
const isBlocked = require('./checkblockuser');


router.get("/referral", isBlocked, async (req, res) => {
  if (!req.session.user) {
    req.flash("error_msg", "please login");
    return res.redirect("/login");
  }

  const userId = req.session.user;

  const recentReferrals = await User.find({referrer: userId})
      .sort({createdAt: -1})
      .limit(5)
      .select("name createdAt");

  res.render("referral", { user: req.session.user, recentReferrals, });
});

module.exports = router;
