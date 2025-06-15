const express = require("express");
const router = express.Router();
const User = require("../models/user.model");
const Transaction = require("../models/transaction");


router.get("/dashboard", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  const userId = req.session.user;


  const recentReferrals = await User.find({ referrer: userId })
    .sort({ createdAt: -1 })
    .limit(5)
    .select("name createdAt");

  const recentWithdrawals = await Transaction.find({ userId })
    .sort({ createdAt: -1 })
    .limit(5)
    .select("type amount status createdAt");

  res.render("index2", { user: req.session.user, recentReferrals, recentWithdrawals, progress: userId.progress, level: userId.level });

});

module.exports = router;