const express = require("express");
const router = express.Router();
const User = require("../models/user.model");
const Rcontrol = require("../models/Reward.model");
const Transaction = require("../models/transaction");
const BannerAD = require("../models/Banner.model");

router.get("/", async (req, res) => {
  if (req.session.user) {
    const banners = await BannerAD.find({ isActive: true });
    const a = Math.floor(Math.random() * 10);
    const b = Math.floor(Math.random() * 10);
    req.session.captcha = a + b;
    res.render("math", {user: req.session.user, a, b, banners});
  } else {
    res.redirect("/login");
  }
});

router.post("/solve-captcha", async (req, res) => {
  const {answer} = req.body;
  const Rcheck = await Rcontrol.findOne({Rname: "control"});
  if (!Rcheck) {
    req.flash("error_msg", "Not Found");
    return res.redirect("/");
  }
  if (req.session.user && parseInt(answer) === req.session.captcha) {
    const user = await User.findById(req.session.user._id);
    const reward = Rcheck.reward;
    user.balance += reward;
    user.progress += 1; // Increse progress, max 100%
    user.totalEarned += reward;
    if (user.progress > 100) user.progress = 100; // max 1000%
    // Check if user progress bar rech 1000%
    if (user.progress >= 100) {
      user.level += 1; // Move to the next level
      user.progress = 0; // Reset progress
    }
    req.session.user = user;
    await user.save();
    // Update referrers balance (5% of earnings)
    if (user.referrer) {
      const referr = await User.findById(user.referrer);
      const referralBonus = Rcheck.referralReward;
      referr.balance += referralBonus;// 5% earnings
      referr.totalRefEarned += referralBonus;
      const transaction = new Transaction({ userId: referr, amount: referralBonus, type: "referral_bonus", status: "received" });
      transaction.save();
      await referr.save();
    }
    req.session.user.balance = user.balance;
    req.session.captcha = null;
    req.flash("success_msg", "Captcha solve correctly.");
    res.redirect("/");
  } else {
    req.flash("error_msg", "Incorrect captcha. please try again.");
    return res.redirect("/");
  }
});

module.exports = router;