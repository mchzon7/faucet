const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const axios = require("axios");
const User = require("../models/user.model");
const Rcontrol = require("../models/Reward.model");
const Transaction = require("../models/transaction");
const BannerAD = require("../models/Banner.model");
const verifyCaptcha = require("./passChaptcha");
const isBlocked = require("./checkblockuser");
const { protect } = require("../middleware/auth");

// Helper function to verify signed HMAC captcha tokens
const verifyCaptchaToken = (answer, token) => {
  if (!token) return false;
  const [hash, expires] = token.split(".");
  if (Date.now() > parseInt(expires, 10)) return false;

  const expectedHash = crypto
    .createHmac("sha256", process.env.JWT_SECRET)
    .update(`${answer}.${expires}`)
    .digest("hex");

  return hash === expectedHash;
};

// Express Middleware for hCaptcha verification
const verifyHCaptcha = async (req, res, next) => {
  const token = req.body["h-captcha-response"];
  if (!token) {
    req.flash("error_msg", "hCaptcha token is required.");
    return res.redirect("/typing-captcha");
  }

  try {
    const response = await axios.post(
      "https://hcaptcha.com/siteverify",
      new URLSearchParams({
        secret: process.env.HCAPTCHA_SECRET || process.env.hcaptcha,
        response: token,
        remoteip: req.ip,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    if (response.data.success) {
      return next();
    } else {
      req.flash("error_msg", "hCaptcha verification failed. Please try again.");
      return res.redirect("/typing-captcha");
    }
  } catch (err) {
    console.error("hCaptcha verification error:", err);
    req.flash("error_msg", "Server error verifying hCaptcha.");
    return res.redirect("/typing-captcha");
  }
};

// GET: Render typing task page
router.get("/typing-captcha", protect, isBlocked, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).lean();
    if (!user) {
      req.flash("error_msg", "Login please");
      return res.redirect("/login");
    }

    const captchaText = Math.random().toString(36).substring(2, 8);
    req.session.captcha = captchaText;

    const banners = await BannerAD.find({ isActive: true }).lean();

    res.render("../views/new/typetask", {
      user,
      captchaText,
      banners,
      title: "FluwentCash",
      appName: process.env.APP_NAME || "FluwentCash",
    });
  } catch (error) {
    console.error("Error fetching typing captcha page:", error);
    req.flash("error_msg", "Server error loading captcha task");
    res.redirect("/");
  }
});

// POST: Validate typed captcha + hCaptcha and apply rewards
router.post(
  "/typingcaptcha",
  protect,
  isBlocked,
  verifyHCaptcha,
  async (req, res) => {
    try {
      const { captchaInput } = req.body;
      const captchaText = req.session.captcha;

      const Rcheck = await Rcontrol.findOne({ Rname: "control" }).lean();
      if (!Rcheck) {
        req.flash("error_msg", "Reward configuration missing");
        return res.redirect("/typing-captcha");
      }

      // Ensure session captcha exists and user input matches case-insensitively
      if (!captchaText || !captchaInput || captchaText.toLowerCase() !== captchaInput.trim().toLowerCase()) {
        req.flash("error_msg", "Incorrect captcha. Please try again.");
        return res.redirect("/typing-captcha");
      }

      const user = await User.findById(req.user._id);
      if (!user) {
        req.flash("error_msg", "Login please");
        return res.redirect("/login");
      }

      // Clear session captcha immediately to prevent reuse
      req.session.captcha = null;

      // Apply earnings & progress update
      const reward = Rcheck.reward || 0;
      user.balance = (user.balance || 0) + reward;
      user.totalEarned = (user.totalEarned || 0) + reward;
      user.progress = (user.progress || 0) + 1;
      user.faucetClaims += 1;

      // Handle user leveling
      if (user.progress >= 100) {
        user.level = (user.level || 1) + 1;
        user.progress = 0;
      }

      await user.save();

      // Process referral earnings
      if (user.referrer) {
        const referr = await User.findById(user.referrer);
        if (referr) {
          const referralBonus = Rcheck.referralReward || 0;
          referr.balance = (referr.balance || 0) + referralBonus;
          referr.totalRefEarned = (referr.totalRefEarned || 0) + referralBonus;

          const transaction = new Transaction({
            userId: referr._id,
            amount: referralBonus,
            type: "referral_bonus",
            status: "received",
          });

          await Promise.all([transaction.save(), referr.save()]);
        }
      }

      req.flash("success_msg", "Captcha solved correctly!");
      return res.redirect("/typing-captcha");
    } catch (error) {
      console.error("Error verifying typing captcha:", error);
      req.flash("error_msg", "Server error processing captcha");
      return res.redirect("/typing-captcha");
    }
  }
);

module.exports = router;


