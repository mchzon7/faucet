const express = require("express");
const User = require('../models/user.model')
const router = express.Router();
const { protect } = require("../middleware/auth");

// Route to track the link before redirecting
router.get("/",protect, async (req, res) => {
  const {url, linkId} = req.query;
  const user = await User.findById(req.user._id).lean();
  if (!user) {
    res.redirect("/login");
  }

  if (!url || !linkId) {
    return res.status(400).send("Invalid request.");
  }

  res.render("track", {url, linkId});
});

module.exports = router;
