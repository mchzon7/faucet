const express = require("express");
const router = express.Router();
const axios = require("axios"); // Added missing import
const User = require("../models/user.model");
const Rcontrol = require("../models/Reward.model");
const Transaction = require("../models/transaction");
const BannerAD = require("../models/Banner.model");
const { protect } = require("../middleware/auth");
const isBlocked = require("./checkblockuser");
const crypto = require("crypto");

// Helper: Generate timed Math Captcha token
const generateCaptchaToken = (answer) => {
  const expires = Date.now() + 5 * 60 * 1000;
  const data = `${answer}.${expires}`;
  const hash = crypto
    .createHmac("sha256", process.env.JWT_SECRET)
    .update(data)
    .digest("hex");
  return `${hash}.${expires}`;
};

// Helper: Verify Math Captcha token
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

// Helper: Verify hCaptcha Token with hCaptcha API
const verifyHCaptcha = async (token, remoteip) => {
  if (!token) return false;

  try {
    const response = await axios.post(
      "https://hcaptcha.com/siteverify",
      new URLSearchParams({
        secret: process.env.hcaptcha,
        response: token,
        remoteip: remoteip,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    return response.data && response.data.success === true;
  } catch (err) {
    console.error("hCaptcha verification error:", err);
    return false;
  }
};

// GET Route
router.get("/math", protect, isBlocked, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).lean();
    const banners = await BannerAD.find({ isActive: true });

    const a = Math.floor(Math.random() * 10);
    const b = Math.floor(Math.random() * 10);
    const captchaToken = generateCaptchaToken(a + b);

    res.render("../views/new/mathsolve", {
      user,
      a,
      b,
      captchaToken,
      hcaptchaSiteKey: process.env.HCAPTCHA_SITE_KEY, // Pass site key to view
      banners,
      appName: process.env.APP_NAME,
      title: "FluwentCash",
    });
  } catch (error) {
    req.flash("error_msg", "Server error loading captcha.");
    res.redirect("/dashboard");
  }
});

// POST Route: Verify BOTH Math Captcha and hCaptcha
router.post("/solve-captcha", protect, isBlocked, async (req, res) => {
  try {
    const { answer, captchaToken, "h-captcha-response": hCaptchaToken } = req.body;

    // 1. Verify Math Captcha
    const isMathValid = verifyCaptchaToken(answer, captchaToken);
    if (!isMathValid) {
      req.flash("error_msg", "Incorrect or expired math answer.");
      return res.redirect("/math");
    }

    // 2. Verify hCaptcha
    const isHCaptchaValid = await verifyHCaptcha(hCaptchaToken, req.ip);
    if (!isHCaptchaValid) {
      req.flash("error_msg", "hCaptcha verification failed. Please try again.");
      return res.redirect("/math");
    }

    // 3. Process Reward if BOTH pass
    const Rcheck = await Rcontrol.findOne({ Rname: "control" });
    if (!Rcheck) {
      req.flash("error_msg", "Reward settings not found.");
      return res.redirect("/math");
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      req.flash("error_msg", "User not found.");
      return res.redirect("/login");
    }

    const reward = Rcheck.reward;
    user.balance += reward;
    user.progress += 1;
    user.faucetClaims += 1;
    user.totalEarned += reward;

    if (user.progress >= 100) {
      user.level += 1;
      user.progress = 0;
    }

    await user.save();
// 4. Handle Referrals
    if (user.referrer) {
      const referr = await User.findById(user.referrer);
      if (referr) {
        const referralBonus = Rcheck.referralReward;
        referr.balance += referralBonus;
        referr.totalRefEarned += referralBonus;
        const transaction = new Transaction({
          userId: referr._id,
          amount: referralBonus,
          type: "referral_bonus",
          status: "received",
        });

        await transaction.save();
        await referr.save();
      }
    }

    req.flash("success_msg", "Both captchas solved correctly!");
    res.redirect("/math");
  } catch (error) {
    console.error("Captcha solve error:", error);
    req.flash("error_msg", "An error occurred processing your reward.");
    res.redirect("/math");
  }
});

module.exports = router;