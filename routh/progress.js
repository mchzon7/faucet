const express = require("express");
const router = express.Router();
const User = require("../models/user.model");
const { protect } = require('../middleware/auth');

router.get("/get-progress",protect , async (req, res) => {
  const user = req.user._id;

  const progress = await User.findById(user);
  if (progress) {
    res.status(200).json({progress: progress.progress});
  } else {
    res.status(500).json({progress: 0});
  }
});

module.exports = router;
