const express = require("express");
const router = express.Router();
const TrackIP = require("../models/TrackIP.model");
const User = require("../models/user.model");
const Rcontrol = require("../models/Reward.model");
const isAdmin = require("./isAdmin");

// Get IP address utility
function getClientIp(req) {
  return req.headers["x-forwarded-for"] || req.socket.remoteAddress;
}

// Route to handle task click
router.get("/complete-task", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  const user = await User.findById(req.session.user._id);
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const existing = await TrackIP.findOne({ ip });
  res.render("trackip", { taskLocked: !!existing, user });
});

router.post("/complete-task", (req, res) => res.redirect("https://trianglerockers.com/1818637"));

// Route to handle task click
router.get("/reward-task", async (req, res) => {
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

  await TrackIP.create({ ip });
  // Reward logic here, e.g., increment user balance
  const user = await User.findById(req.session.user._id);
  const reward = Rcheck.dailyofferreward;
  user.balance += reward;
  req.session.user = user;
  await user.save();


  req.flash("success_msg", "Task completed and rewarded!");
  return res.redirect("/complete-task");
});

// Get recent IP logs (e.g., last 24 hrs)
router.get("/admin/ip-logs", isAdmin, async (req, res) => {
  const logs = await TrackIP.find().populate("userId", "email");
  res.render("admin-ip-logs", { logs });
});

module.exports = router;