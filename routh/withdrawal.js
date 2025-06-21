const express = require("express");
const router = express.Router();
const Transaction = require("../models/transaction");
const User = require("../models/user.model");
const isBlocked = require('./checkblockuser');

// Withdrawal Routh
router.get("/withdrawal", isBlocked, (req, res) => {
  if (!req.session.user) {
    req.flash("error_msg", "please login");
    return res.redirect("/login");
  }

  res.render("withdrawal", {user: req.session.user});
});

router.post("/withdraw", async (req, res) => {
  if (!req.session.user) {
    req.flash("error_msg", "please login");
    res.redirect("/login");
  }
  try {
    const userId = req.session.user._id;
    const {amount} = req.body;
    const {wallet} = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      req.flash("error_msg", "Invalid amount");
      return res.redirect("/withdrawal");
    }

    // Get user balance
    const user = await User.findById(userId);
    if (!user || user.balance < amount) {
      req.flash("error_msg", "Insufficient balance");
      return res.redirect("/withdrawal");
    }

    if (user.isVerified !== true) {
      req.flash("error_msg", "You need to verified your account to withdraw");
      return res.redirect("/withdrawal");
    }

    if (amount < 3) {
      req.flash("error_msg", "The menimum withrawal is 3usd");
      return res.redirect("/withdrawal");
    }

    if (req.session.user.balance >= 2) {
      const user = await User.findById(userId);
      const apiKey = process.env.WithdrawKey;
      const to = wallet;
      const amonn = parseInt(amount * 100000000);
      const currency = "DOGE";

      const data = new URLSearchParams();
      data.append("api_key", apiKey);
      data.append("to", to);
      data.append("amount", amonn);
      data.append("currency", currency);

      const transaction = new Transaction({userId, amount, type: "withdrawal", status: "completed"});
      transaction.save();

      fetch("https://faucetpay.io/api/v1/send", {
            method: "POST",
            body: data,
      })
          .then(response => response.json())
          .then(json => {
            if (json.status === 200) {
              user.balance -= amount;
              user.save();
              req.session.user.balance = user.balance;
              req.flash("success_msg", "Withdrawal successfully");
              res.redirect("/withdrawal");
            } else {
              req.flash("error_msg", "Withdrawal failed");
              return res.redirect("/withdrawal");
            }
          })
          .catch(() => {
            req.flash("error_msg", "Minimum balance required: 3 USDT");
            return res.render("withdrawal");
          });
    }
  } catch (error) {
    console.error(error);
    req.flash("error_msg", "server error");
    return res.render("withdrawal");
  }
});

module.exports = router
