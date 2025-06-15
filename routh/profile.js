const express = require("express");
const router = express.Router();
const User = require("../models/user.model");

router.get("/profile", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  try {
    const userProfile = await User.findById(req.session.user._id);
    if (userProfile) {
      res.render("profile", {userProfile});
    } else {
      return res.redirect("/login");
    }
  } catch (error) {
    console.error(error);
  }
});

module.exports = router;
