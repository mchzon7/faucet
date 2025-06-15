const express = require("express");
const router = express.Router();
const User = require("../models/user.model");
const adminn = require("../models/adminschema");
const Link = require("../models/link.model");
const RewardSchema = require("../models/Reward.model");
const Transaction = require("../models/transaction");
const bcrypt = require("bcrypt");

// Admin routh
router.get("/admin", (req, res) => {
  res.render("admin-login", { success_msg: req.flash("success_msg") });
});

// Admin login routh handler
router.post("/admin/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await adminn.findOne({ username });
    if (!user || user.role !== "admin") {
      req.flash("error_msg", "Invalid admin credentials.");
      return res.redirect("/admin");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      req.flash("error_msg", "Incorrect password");
      return res.redirect("/admin");
    }
    req.session.user = user;
    res.redirect("/admin/dashboard");
  } catch (error) {
    console.error(error);
    req.flash("error_msg", "Login failed.");
    res.redirect("/admin");
  }
});

// Admin Dashboard
router.get("/admin/dashboard", isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const totalUsers = await User.countDocuments();
    const activeSince = new Date();
    activeSince.setDate(activeSince.getDate() - 7);
    const activeUsers = await User.countDocuments({ lastLogin: { $gte: activeSince } });
    const blockedUsers = await User.countDocuments({ isBlocked: true });
    const totalEarnings = await User.aggregate([
      { $group: { _id: null, total: { $sum: "$balance" } } }
    ]);
    const transactions = await Transaction.find()
      .populate("type amount status") // get user info
      .sort({ createdAt: -1 })
      .skip(skip)       // latest first
      .limit(limit);                     // adjust as needed

    res.render("typingCaptcha", {
      totalUsers,
      activeUsers,
      transactions,
      currentPage: page,
      totalPages: Math.ceil(transactions / limit),
      blockedUsers,
      totalEarnings: totalEarnings[0]?.total || 0
    });
  } catch (err) {
    res.status(500).send("Server error");
  }
});


// Delete a transaction by ID
router.post("/delete-transaction/:id", isAdmin, async (req, res) => {
  try {
    await Transaction.findByIdAndDelete(req.params.id);
    res.redirect("/admin/dashboard");
  } catch (err) {
    console.error("Error deleting transaction:", err);
    res.status(500).send("Server error deleting transaction");
  }
});
// POST route to update user balance
router.post("/update-balance", isAdmin, async (req, res) => {
  const { email, balance } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send("User not found.");
    }

    user.balance = parseFloat(balance);
    await user.save();

    res.redirect("/admin/dashboard");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error while updating balance.");
  }
});

// GET reward settings
router.get("/rewards", isAdmin, async (req, res) => {
  let settings = await RewardSchema.findOne();
  if (!settings) {
    settings = await RewardSchema.create({});
  }
  res.render("setreward", { settings });
});

// POST update reward settings
router.post("/rewards", isAdmin, async (req, res) => {
  const { Rname, reward, visitreward, oofdreward, dailyofferreward, visit10sitereward, referralReward } = req.body;
  let settings = await RewardSchema.findOne();
  if (!settings) {
    settings = await RewardSchema.create({ Rname, reward, visitreward, oofdreward, dailyofferreward, visit10sitereward, referralReward });
  } else {
    settings.Rname = Rname;
    settings.reward = parseFloat(reward);
    settings.visitreward = parseFloat(visitreward);
    settings.oofdreward = parseFloat(oofdreward);
    settings.dailyofferreward = parseFloat(dailyofferreward);
    settings.visit10sitereward = parseFloat(visit10sitereward);
    settings.referralReward = parseFloat(referralReward);
    await settings.save();
  }
  res.redirect("/rewards");
});

// Adding a PTC Link 
router.get("/addlinks", (req, res) => res.render("admin"));
router.post("/ptc/add-link", async (req, res) => {
  const { name, url, description, reward } = req.body;

  try {
    const newLink = new Link({ name, url, description, reward: parseFloat(reward) });
    await newLink.save();
    req.flash("success_msg", "Link added successfully!");
    res.redirect("/admin/dashboard");
  } catch (error) {
    console.error(error);
    req.flash("error_msg", "Error adding link.");
    res.redirect("/addlinks");
  }
});

// Authenticate an admin
function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.role == "admin") {
    return next(); // Allow access
  }
  req.flash("error_msg", "Unauthorized access.");
  return res.redirect("/admin"); // Redirect unauthorized users
}

// adding an admin using postman or request.rest
router.post("/make-admin", async (req, res) => {
  try {
    const { username, password } = req.body; // Assuming email is used to identify the user
    const user = await adminn.findOne({ username });
    if (user) {
      return res.status(404).json({ message: "User already axiests." });
    }
    const hashPassword = await bcrypt.hash(password, 10);
    const adminUser = new adminn({
      username,
      password: hashPassword,
      role: "admin",
    });
    await adminUser.save();
    res.status(201).json({ message: "Admin created successfully." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error.Try again Later" });
  }

});

module.exports = router;