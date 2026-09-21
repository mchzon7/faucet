const express = require("express");
const router = express.Router();
const User = require("../models/user.model");
const Transaction = require("../models/transaction");
const checkBlocked = require("./checkblockuser"); // Standardized destructuring import
const { protect } = require("../middleware/auth");

router.get("/dashboard", protect,checkBlocked, async (req, res) => {
  try {
    // 1. Fetch full user document (req.user from protect middleware usually only holds basic payload or ID)
    const user = await User.findById(req.user._id).lean();

    if (!user) {
      req.flash("error_msg", "User not found.");
      return res.redirect("/login");
    }

    // 2. Query recent referrals and transactions in parallel for better performance
    const [recentReferrals, recentWithdrawals] = await Promise.all([
      User.find({ referrer: user._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name createdAt")
        .lean(),
      Transaction.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("type amount status createdAt")
        .lean(),
    ]);

    // 3. Render view with full user object and properties
    res.render("../views/new/dashboard", {
      user,
      recentReferrals,
      recentWithdrawals,
      progress: user.progress,
      level: user.level,
      appName: process.env.APP_NAME,
      title: "Dashboard",
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    req.flash("error_msg", "Failed to load dashboard data.");
    res.redirect("/login");
  }
});

module.exports = router;