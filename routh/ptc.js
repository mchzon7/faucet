const express = require("express");
const router = express.Router();
const Link = require("../models/link.model");
const User = require("../models/user.model");
const Rcontrol = require("../models/Reward.model");
const Transaction = require("../models/transaction");

const ITEMS_PER_PAGE = 10;

router.get("/ptc3", async (req, res) => {
  const page = parseInt(req.query.page) || 1;

  try {
    const user = await User.findById(req.session.user._id);
    const totalLink = await Link.countDocuments();
    const links = await Link.find({_id: {$nin: user.visitedLinks}})
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);

    res.render("ptc3", {user: user,ptcLinks:links,currentPage:page,
    totalPages: Math.ceil(totalLink/ITEMS_PER_PAGE)});

  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading PTC links");
  }
});

router.post("/reward-user", async (req, res) => {
  const Rcheck = await Rcontrol.findOne({Rname: "control"});
  if (!Rcheck) {
    req.flash("error_msg", "Not Found");
    return res.redirect("/ptc3");
  }
  try {
    if (!req.session.user) {
      req.flash("error_msg", "Login please");
      return res.redirect("/login");
    }

    const user = await User.findById(req.session.user._id);
    if (!user) {
      req.flash("error_msg", "User not found");
      return res.redirect("/login");
    }

    const link = await Link.findById(req.body.linkId);
    if (!link) {
      req.flash("error_msg", "Link not found");
      return res.redirect("/ptc3");
    }

    // Check if the user has already visited the link
    if (user.visitedLinks && user.visitedLinks.includes(req.body.linkId)) {
      return res.status(400).json({ success: false, message: "You have already visited this link" });
    }

    // Add reward and mark link as visited
    user.balance += link.reward;
    user.totalEarned += link.reward;
    user.visitedLinks = user.visitedLinks || [];
    user.visitedLinks.push(req.body.linkId);
    req.session.user = user;

    await user.save();

    if (user.referrer) {
      const referr = await User.findById(user.referrer);
      const referralBonus = Rcheck.visitreward; // 5% earnings
      referr.balance += referralBonus;
      referr.totalRefEarned += referralBonus;
      const transaction = new Transaction({userId: referr, amount: referralBonus, type: "referral_bonus", status: "received"});
      transaction.save();
      await referr.save();
    }

    res.json({success: true, message: "Reward added!", balance: user.balance});
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
