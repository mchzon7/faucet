const express = require("express");
const router = express.Router();
const User = require("../models/user.model");
const Rcontrol = require("../models/Reward.model");
const Transaction = require("../models/transaction");
const verifyCaptcha = require('./passChaptcha');
const BannerAD = require("../models/Banner.model");
const isBlocked = require('./checkblockuser');


router.get("/typing-captcha", isBlocked, async (req, res) => {
  if (req.session.user) {
    const captchaText = Math.random().toString(36).substring(2, 8);
    const banners = await BannerAD.find({ isActive: true });
    req.session.captcha = captchaText;
    const user = req.session.user;
    res.render("typingCaptcha2", {user, captchaText,banners});
  } else {
    return res.redirect("/login");
  }
});

router.post("/typing-captcha", verifyCaptcha, async (req, res) => {
  const {captchaInput} = req.body;
  const captchaText = req.session.captcha;
  const Rcheck = await Rcontrol.findOne({Rname: "control"});
  if (!Rcheck) {
    req.flash("error_msg", "Not Found");
    return res.redirect("/typing-captcha");
  }

  if (req.session.captcha && req.session.captcha.toLowerCase() === captchaInput && captchaInput === captchaText) {
    try {
      const user = await User.findById(req.session.user._id);

      // Increase user balance
      const reward = Rcheck.reward;
      user.balance += reward;
      user.progress += 1;
      user.totalEarned += reward;
      if (user.progress >= 100) {
        user.level += 1; // Move to the next level
        user.progress = 0; // Reset progress
      }
      req.session.user = user;
      await user.save();

      // Update referrers balance (5% of earnings)

      if (user.referrer) {
        const referr = await User.findById(user.referrer);
        const referralBonus = Rcheck.referralReward; // 5% earnings
        referr.balance += referralBonus;
        referr.totalRefEarned += referralBonus;
        const transaction = new Transaction({userId: referr, amount: referralBonus, type: "referral_bonus", status: "received"});
        transaction.save();
        await referr.save();
      }
      req.session.user.balance = user.balance;
      req.session.captcha = null;
      req.flash("success_msg", "Captcha solve correctly.");
      return res.redirect("/typing-captcha");
      // res.redirect("/typing-captcha");  Redirect to homepage
    } catch (error) {
      req.flash("error_msg", "Error updating balance:" + error.message);
      return res.render("typingCaptcha2");
    }
  } else {
    req.flash("error_msg", "Incorrect captcha. please try again.");
    return res.render("typingCaptcha2");
  }
});

module.exports = router;
