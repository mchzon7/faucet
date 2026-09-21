const express = require("express");
const router = express.Router();
const Link = require("../models/link.model");
const User = require("../models/user.model");
const Rcontrol = require("../models/Reward.model");
const Transaction = require("../models/transaction");
const isBlocked = require("./checkblockuser");
const { protect } = require("../middleware/auth");

const ITEMS_PER_PAGE = 10;

// GET: Render shortlinks page
router.get("/ptc3", protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const user = await User.findById(req.user._id).lean();

    if (!user) {
      req.flash("error_msg", "Login please");
      return res.redirect("/login");
    }

    const visitedLinks = user.visitedLinks || [];
    const filter = { _id: { $nin: visitedLinks } };

    // Count only UNVISITED links for accurate pagination
    const totalUnvisitedLinks = await Link.countDocuments(filter);

    const links = await Link.find(filter)
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE)
      .lean();

    res.render("../views/new/shortlink", {
      user,
      ptcLinks: links,
      currentPage: page,
      totalPages: Math.ceil(totalUnvisitedLinks / ITEMS_PER_PAGE) || 1,
      appName: process.env.APP_NAME,
      title: "FluwentCash",
    });
  } catch (error) {
    console.error("Error fetching PTC links:", error);
    req.flash("error_msg", "Server error while fetching links");
    res.redirect("/");
  }
});

// POST: Process link reward
router.post("/reward-user", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id);
    if (!user) {
      req.flash("error_msg", "Login please");
      return res.redirect("/login");
    }

    const Rcheck = await Rcontrol.findOne({ Rname: "control" }).lean();
    if (!Rcheck) {
      req.flash("error_msg", "Reward configuration missing");
      return res.redirect("/ptc3");
    }

    const link = await Link.findById(req.body.linkId);
    if (!link) {
      req.flash("error_msg", "Link not found");
      return res.redirect("/ptc3");
    }

    // Initialize visitedLinks array if undefined
    if (!user.visitedLinks) {
      user.visitedLinks = [];
    }

    // Prevent double claiming
    const linkIdStr = req.body.linkId.toString();
    const hasVisited = user.visitedLinks.some((id) => id.toString() === linkIdStr);

    if (hasVisited) {
      req.flash("error_msg", "You have already visited this link");
      return res.redirect("/ptc3");
    }

    // Update user balance and visited list
    user.balance = (user.balance || 0) + link.reward;
    user.totalEarned = (user.totalEarned || 0) + link.reward;
    user.visitedLinks.push(link._id);

    await user.save();

    // Process referral bonus if a referrer exists
    if (user.referrer) {
      const referr = await User.findById(user.referrer);
      if (referr) {
        const referralBonus = Rcheck.visitreward || 0;
        referr.balance = (referr.balance || 0) + referralBonus;
        referr.totalRefEarned = (referr.totalRefEarned || 0) + referralBonus;

        const transaction = new Transaction({
          userId: referr._id,
          amount: referralBonus,
          type: "referral_bonus",
          status: "received",
        });

        await Promise.all([transaction.save(), referr.save()]);
      }
    }

    req.flash("success_msg", `Reward added! New balance: ${user.balance}`);
    return res.redirect("/ptc3");
  } catch (error) {
    console.error("Error adding reward:", error);
    req.flash("error_msg", "Server error processing reward");
    return res.redirect("/ptc3");
  }
});

module.exports = router;