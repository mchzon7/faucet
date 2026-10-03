const express = require("express");
const router = express.Router();
const useragent = require("express-useragent");
const axios = require("axios");
const TrackIP = require("../models/TrackIP.model");
const User = require("../models/user.model");
const Rcontrol = require("../models/Reward.model");
const isAdmin = require("./isAdmin");
const { protect } = require("../middleware/auth");

// Enable express-useragent middleware
router.use(useragent.express());

// CPA Grip API Credentials
const CPAGRIP_USER_ID = process.env.CPAGRIP_USER_ID || "YOUR_USER_ID";
const CPAGRIP_API_KEY = process.env.CPAGRIP_API_KEY || "YOUR_API_KEY";

// Helper function: Extract client IP
function getClientIp(req) {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
  return ip.split(",")[0].trim();
}

// Helper function: Detect target device platform
function getDeviceType(req) {
  const ua = req.useragent;
  if (ua.isAndroid) return "android";
  if (ua.isiPhone || ua.isiPad || ua.isiPod) return "ios";
  return "desktop";
}

// Route to fetch live CPA Grip offers and render daily task page
router.get("/complete-task", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.redirect("/login");
    }

    const ip = getClientIp(req);
    const existing = await TrackIP.findOne({ ip });
    const userDevice = getDeviceType(req);

    let offers = [];

    // Fetch offers only if the user hasn't completed the task today
    if (!existing) {
      try {
        const apiResponse = await axios.get("https://www.cpagrip.com/common/offer_feed_json.php", {
          params: {
            user_id: CPAGRIP_USER_ID,
            key: CPAGRIP_API_KEY,
            ip: ip, // Geo-targets offers to user's country
            tracking_id: user._id.toString()
          },
          timeout: 5000
        });

        const allOffers = apiResponse.data.offers || [];

        // Filter API offers according to user device platform
        offers = allOffers.filter(offer => {
          const uaRequirement = (offer.useragent || "").toLowerCase();

          if (userDevice === "android") {
            return uaRequirement.includes("android");
          } else if (userDevice === "ios") {
            return uaRequirement.includes("iphone") || uaRequirement.includes("ipad") || uaRequirement.includes("ios");
          } else {
            // Desktop / Generic web offers
            return !uaRequirement.includes("android") && !uaRequirement.includes("iphone") && !uaRequirement.includes("ipad");
          }
        });

      } catch (apiErr) {
        console.error("CPA Grip API Fetch Error:", apiErr.message);
      }
    }

    res.render("../views/new/dailytask", {
      taskLocked: !!existing,
      user,
      userDevice,
      offers: offers.slice(0, 3), // Take top 3 relevant offers
      appName: process.env.APP_NAME,
      title: "FluwentCash",
      success_msg: req.flash("success_msg"),
      error_msg: req.flash("error_msg")
    });

  } catch (err) {
    console.error("Task Page Error:", err);
    res.redirect("/dashboard");
  }
});

// Route to handle task click
router.post("/complete-task", protect, (req, res) => {
  const offerUrl = req.body.offerUrl || "https://trianglerockers.com/1818637";
  return res.redirect(offerUrl);
});

// Route to handle reward assignment post-task
router.get("/reward-task", protect, async (req, res) => {
  try {
    const ip = getClientIp(req);

    const Rcheck = await Rcontrol.findOne({ Rname: "control" });
    if (!Rcheck) {
      req.flash("error_msg", "Not Found");
      return res.redirect("/complete-task");
    }

    const existing = await TrackIP.findOne({ ip });
    if (existing) {
      req.flash("error_msg", "Task already completed with this IP. Try again after 24 hours.");
      return res.status(403).json({ message: "Task already completed. Try again after 24 hours." });
    }

    // Lock IP and associate with user ID
    await TrackIP.create({ ip, userId: req.user._id });

    // Update user balance
    const user = await User.findById(req.user._id);
    const reward = Rcheck.dailyofferreward || 0.30;
    user.balance += reward;
    await user.save();

    if (req.session && req.session.user) {
      req.session.user = user;
    }

    req.flash("success_msg", "Task completed and rewarded!");
    return res.redirect("/complete-task");

  } catch (err) {
    console.error("Reward Error:", err);
    req.flash("error_msg", "Error rewarding task.");
    return res.redirect("/complete-task");
  }
});

// Get recent IP logs (Admin)
router.get("/admin/ip-logs", isAdmin, async (req, res) => {
  try {
    const logs = await TrackIP.find().populate("userId", "email");
    res.render("admin-ip-logs", { logs, appName: process.env.APP_NAME });
  } catch (err) {
    res.status(500).send("Server Error: " + err.message);
  }
});

module.exports = router;