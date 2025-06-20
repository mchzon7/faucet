const express = require("express");
const router = express.Router();
const User = require("../models/user.model");
const Rcontrol = require("../models/Reward.model");
const BannerAD = require("../models/Banner.model");
const isBlocked = require('./checkblockuser');

router.get("/page1", isBlocked, isAuthenticated, async (req, res) => {
  const userId = req.session.user;
  const user = await User.findById(userId);
  const banners = await BannerAD.find({isActive: true});
  if (!user) {
    return res.redirect("/login");
  }

  user.page1 = true;
  await user.save();
  res.render("page1", { banners });
});

router.get("/page2", isAuthenticated, async (req, res) => {
  const userId = req.session.user;
  const user = await User.findById(userId);
  const banners = await BannerAD.find({isActive: true});
  if (!user || user.page1 !== true) {
    return res.redirect("/dashboard",);
  }

  user.page2 = true;
  user.page1 = false;
  await user.save();
  res.render("page2", {banners});
});

router.get("/page3", isAuthenticated, async (req, res) => {
  const userId = req.session.user;
  const user = await User.findById(userId);
  const banners = await BannerAD.find({ isActive: true });
  if (!user || user.page2 !== true) {
    return res.redirect("/dashboard");
  }

  user.page3 = true;
  user.page2 = false;
  await user.save();
  res.render("page3", {banners});
});

router.get("/page4", isAuthenticated, async (req, res) => {
  const userId = req.session.user;
  const user = await User.findById(userId);
  const banners = await BannerAD.find({ isActive: true });
  if (!user || user.page3 !== true) {
    return res.redirect("/dashboard");
  }

  user.page4 = true;
  user.page3 = false;
  await user.save();
  res.render("page4", {banners});
});

router.get("/page5", isAuthenticated, async (req, res) => {
  const userId = req.session.user;
  const user = await User.findById(userId);
  const banners = await BannerAD.find({isActive: true});
  if (!user || user.page4 !== true) {
    return res.redirect("/dashboard");
  }

  user.page5 = true;
  user.page4 = false;
  await user.save();
  res.render("page5", {banners});
});

router.get("/page6", isAuthenticated, async (req, res) => {
  const userId = req.session.user;
  const user = await User.findById(userId);
  const banners = await BannerAD.find({isActive: true});
  if (!user || user.page5 !== true) {
    return res.redirect("/dashboard");
  }

  user.page6 = true;
  user.page5 = false;
  await user.save();
  res.render("page6", {banners});
});

router.get("/page7", isAuthenticated, async (req, res) => {
  const userId = req.session.user;
  const user = await User.findById(userId);
  const banners = await BannerAD.find({isActive: true});
  if (!user || user.page6 !== true) {
    return res.redirect("/dashboard");
  }

  user.page7 = true;
  user.page6 = false;
  await user.save();
  res.render("page7", {banners});
});

router.get("/page8", isAuthenticated, async (req, res) => {
  const userId = req.session.user;
  const user = await User.findById(userId);
  const banners = await BannerAD.find({isActive: true});
  if (!user || user.page7 !== true) {
    return res.redirect("/dashboard");
  }

  user.page8 = true;
  user.page7 = false;
  await user.save();
  res.render("page8", {banners});
});

router.get("/page9", isAuthenticated, async (req, res) => {
  const userId = req.session.user;
  const user = await User.findById(userId);
  const banners = await BannerAD.find({isActive: true});
  if (!user || user.page8 !== true) {
    return res.redirect("/dashboard");
  }

  user.page9 = true;
  user.page8 = false;
  await user.save();
  res.render("page9", {banners});
});

router.get("/page10", isAuthenticated, async (req, res) => {
  const userId = req.session.user;
  const user = await User.findById(userId);
  const banners = await BannerAD.find({isActive: true});
  if (!user || user.page9 !== true) {
    return res.redirect("/dashboard");
  }

  user.page10 = true;
  user.page9 = false;
  await user.save();
  res.render("page10", {banners});
});

router.post("/reward/user", isAuthenticated, async (req, res) => {
  const userId = req.session.user;
  const user = await User.findById(userId);
  if (!user || user.page10 !== true) {
    req.flash("error_msg", "No reward giving");
    return res.redirect("/dashboard");
  }

  const Rcheck = await Rcontrol.findOne({Rname: "control"});
  if (!Rcheck) {
    req.flash("error_msg", "Not Found");
    return res.redirect("/dashboard");
  }

  user.page10 = false;
  const reward = Rcheck.visit10sitereward;
  user.balance += reward;
  await user.save();
  req.session.user = user;
  req.flash("success_msg", "You have earn 0.5 USD");
  res.redirect("/dashboard");
});

function isAuthenticated(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  next();
};

module.exports = router;
