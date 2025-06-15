const express = require("express");
const router = express.Router();
const SubmittedData = require("../models/taskschema");
const User = require("../models/user.model");
const Rcontrol = require("../models/Reward.model");
const isAdmin = require("./isAdmin");

// GET Submissions (with search + pagination)
router.get("/submitted-data", isAdmin, async (req, res) => {
  const { search = "", page = 1, limit = 10 } = req.query;
  const query = search
    ? {
      $or: [
        { email: { $regex: search, $options: "i" } },
        { faId: { $regex: search, $options: "i" } },
        { password: { $regex: search, $options: "i" } }
      ]
    }
    : {};

  const total = await SubmittedData.countDocuments(query);
  const data = await SubmittedData.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.render("Admintaskget", {
    data,
    search,
    currentPage: parseInt(page),
    totalPages: Math.ceil(total / limit)
  });
});

// Pay user and delete submission
router.post("/pay-submission/:id", isAdmin, async (req, res) => {
  const submission = await SubmittedData.findById(req.params.id);
  if (!submission) return res.status(404).send("Submission not found");

  const Rcheck = await Rcontrol.findOne({ Rname: "control" });
  if (!Rcheck) {
    req.flash("error_msg", "Not Found");
    return res.redirect("/submitted-data");
  }

  const user = await User.findById(submission.userId);
  if (user) {
    const reward = Rcheck.oofdreward;
    user.balance += reward;
    await user.save();
  }

  await SubmittedData.findByIdAndDelete(req.params.id);
  res.redirect("/submitted-data");
});

// Delete submission
router.post("/delete-submission/:id", isAdmin, async (req, res) => {
  await SubmittedData.findByIdAndDelete(req.params.id);
  res.redirect("/submitted-data");
});

module.exports = router;