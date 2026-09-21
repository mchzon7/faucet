const express = require("express");
const router = express.Router();
const User = require("../models/user.model");
const isBlocked = require('./checkblockuser');
const {protect } = require('../middleware/auth');

router.get("/profile", protect, async (req, res) => {
  const userId = req.user._id;
  if (!userId) {
    return res.redirect("/login");
  }

  try {
    const userProfile = await User.findById(userId);
    if (userProfile) {
      res.render("../views/new/profile", {userProfile, appName: process.env.APP_NAME, title: 'FluwentCash'});
    } else {
      return res.redirect("/login");
    }
  } catch (error) {
    console.error(error);
  }
});

module.exports = router;
