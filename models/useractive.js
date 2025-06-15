const express = require("express");
const router = express.Router();
const User = require("./user.model"); // Import User model


// Get user activity (total earnings)
router.get("/", async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      totalEarned: user.totalEarned,
      balance: user.balance,
      totalRefEarned: user.totalRefEarned
    });
  } catch (error) {
    console.error("Error fetching user activity:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;