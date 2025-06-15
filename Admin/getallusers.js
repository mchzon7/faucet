const express = require("express");
const router = express.Router();
const User = require("../models/user.model");
const isAdmin = require("./isAdmin");
const { Parser } = require("json2csv");


// GET all users (with optional search, pagination, format)
router.get("/all-users", isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", format = "html" } = req.query;

    const query = {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ]
    };

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    if (format === "json") {
      return res.json({ users, total });
    } else if (format === "csv") {
      const fields = ["name", "email", "createdAt", "isVerified", "referrer"];
      const parser = new Parser({ fields });
      const csv = parser.parse(users);
      res.header("Content-Type", "text/csv");
      res.attachment("users.csv");
      return res.send(csv);
    }

    res.render("admin-getall-user", {
      users,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      search,
      totalUsers: total
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// DELETE user
router.delete("/delete-user/:id", isAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    req.flash("success_msg", "User deleted successfully");
    res.redirect("/all-users");
  } catch (err) {
    res.status(500).json({ success: false, error: "Error deleting user" });
  }
});

// BLOCK/UNBLOCK user
router.post("/block-user/:id", isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    user.isBlocked = !user.isBlocked;
    await user.save();
    req.flash("success_msg", "Successfully");
    res.redirect("/all-users");
  } catch (err) {
    res.status(500).json({ success: false, error: "Error blocking/unblocking user" });
  }
});


module.exports = router;