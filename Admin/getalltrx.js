const express = require("express");
const router = express.Router();
const Transaction = require("../models/transaction");
const isAdmin = require("./isAdmin");


router.get("/recent-transactions", isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const transactions = await Transaction.find({})
      .populate("type amount status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalTransactions = await Transaction.countDocuments();

    res.render("getalltrx.ejs", {
      transactions,
      currentPage: page,
      totalPages: Math.ceil(totalTransactions / limit)
    });
  } catch (err) {
    console.error("Error loading transactions:", err);
    res.status(500).send("Server error loading transactions");
  }
});

// Delete a transaction by ID
router.post("/delete-transact/:id", isAdmin, async (req, res) => {
  try {
    await Transaction.findByIdAndDelete(req.params.id);
    res.redirect("/recent-transactions");
  } catch (err) {
    console.error("Error deleting transaction:", err);
    res.status(500).send("Server error deleting transaction");
  }
});

module.exports = router;